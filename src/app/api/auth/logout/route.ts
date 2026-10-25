import { NextResponse } from "next/server";

/**
 * Extracted logout handler logic for unit testing.
 */
export function handleLogout(): {
  status: number;
  body: Record<string, unknown>;
  cookie: { name: string; value: string; options: Record<string, unknown> };
} {
  return {
    status: 200,
    body: { message: "Logged out successfully" },
    cookie: {
      name: "token",
      value: "",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      },
    },
  };
}

export async function POST() {
  try {
    const result = handleLogout();

    const response = NextResponse.json(result.body, { status: result.status });

    response.cookies.set(result.cookie.name, result.cookie.value, {
      httpOnly: result.cookie.options.httpOnly as boolean,
      secure: result.cookie.options.secure as boolean,
      sameSite: result.cookie.options.sameSite as "strict",
      path: result.cookie.options.path as string,
      maxAge: result.cookie.options.maxAge as number,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
