import { NextRequest, NextResponse } from "next/server";
import { FileUserRepository } from "@/lib/repositories/file-user-repository";
import { hashPassword } from "@/lib/auth/password";
import { UserRepository } from "@/lib/repositories/types";

const userRepository: UserRepository = new FileUserRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate username
    if (!username || typeof username !== "string" || username.trim() === "") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Validate password length
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check for duplicate username
    const exists = await userRepository.existsByUsername(username.trim());
    if (exists) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await userRepository.create({
      username: username.trim(),
      passwordHash,
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
