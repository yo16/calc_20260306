import { NextRequest, NextResponse } from "next/server";
import { FileUserRepository } from "@/lib/repositories/file-user-repository";
import { verifyPassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/jwt";
import { UserRepository } from "@/lib/repositories/types";

const userRepository: UserRepository = new FileUserRepository();

/**
 * Extracted login handler logic for unit testing.
 * Accepts dependencies for testability.
 */
export async function handleLogin(
  body: Record<string, unknown>,
  repo: UserRepository,
  passwordVerifier: (password: string, hash: string) => Promise<boolean> = verifyPassword,
  tokenGenerator: (payload: { userId: string; email: string }) => string = generateToken
): Promise<{
  status: number;
  body: Record<string, unknown>;
  cookie?: { name: string; value: string; options: Record<string, unknown> };
}> {
  const { username, password } = body;

  // Validate username
  if (!username || typeof username !== "string" || username.trim() === "") {
    return {
      status: 400,
      body: { error: "Username is required" },
    };
  }

  // Validate password
  if (!password || typeof password !== "string" || password === "") {
    return {
      status: 400,
      body: { error: "Password is required" },
    };
  }

  const trimmedUsername = username.trim();

  // Find user by username
  const user = await repo.findByUsername(trimmedUsername);
  if (!user) {
    return {
      status: 401,
      body: { error: "Invalid credentials" },
    };
  }

  // Verify password
  const isValid = await passwordVerifier(password, user.passwordHash);
  if (!isValid) {
    return {
      status: 401,
      body: { error: "Invalid credentials" },
    };
  }

  // Generate JWT
  const token = tokenGenerator({ userId: user.id, email: user.username });

  return {
    status: 200,
    body: {
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    },
    cookie: {
      name: "token",
      value: token,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      },
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await handleLogin(body, userRepository);

    const response = NextResponse.json(result.body, { status: result.status });

    if (result.cookie) {
      response.cookies.set(result.cookie.name, result.cookie.value, {
        httpOnly: result.cookie.options.httpOnly as boolean,
        secure: result.cookie.options.secure as boolean,
        sameSite: result.cookie.options.sameSite as "strict",
        path: result.cookie.options.path as string,
        maxAge: result.cookie.options.maxAge as number,
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
