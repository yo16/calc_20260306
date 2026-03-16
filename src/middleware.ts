import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Paths that do not require authentication.
 * Users can access these without a valid JWT token.
 */
const PUBLIC_PATHS = ["/login", "/signup", "/api/auth/"];

/**
 * Check whether a given pathname is a public (unauthenticated) path.
 */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((publicPath) => pathname.startsWith(publicPath));
}

/**
 * Core middleware logic extracted for testability.
 *
 * Returns:
 *  - { action: "next" } if the request should proceed
 *  - { action: "redirect", destination: string } if the user should be redirected
 */
export async function handleMiddleware(
  pathname: string,
  token: string | undefined,
  tokenVerifier: (token: string) => Promise<unknown>
): Promise<{ action: "next" } | { action: "redirect"; destination: string }> {
  // Allow public paths without authentication
  if (isPublicPath(pathname)) {
    return { action: "next" };
  }

  // No token present -> redirect to login
  if (!token) {
    return { action: "redirect", destination: "/login" };
  }

  // Verify the token
  const payload = await tokenVerifier(token);
  if (!payload) {
    return { action: "redirect", destination: "/login" };
  }

  return { action: "next" };
}

/**
 * Verify JWT using jose (Edge Runtime compatible).
 */
async function verifyTokenEdge(token: string): Promise<unknown> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return null;
    }
    const encodedSecret = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Next.js Middleware entry point.
 * Checks JWT authentication and redirects unauthenticated users to /login.
 * Uses jose library for Edge Runtime compatibility.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get("token")?.value;
  const result = await handleMiddleware(request.nextUrl.pathname, token, verifyTokenEdge);

  if (result.action === "redirect") {
    const loginUrl = new URL(result.destination, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Matcher configuration: apply middleware to all paths except static assets.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
