import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

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
export function handleMiddleware(
  pathname: string,
  token: string | undefined,
  tokenVerifier: (token: string) => unknown
): { action: "next" } | { action: "redirect"; destination: string } {
  // Allow public paths without authentication
  if (isPublicPath(pathname)) {
    return { action: "next" };
  }

  // No token present -> redirect to login
  if (!token) {
    return { action: "redirect", destination: "/login" };
  }

  // Verify the token
  const payload = tokenVerifier(token);
  if (!payload) {
    return { action: "redirect", destination: "/login" };
  }

  return { action: "next" };
}

/**
 * Next.js Middleware entry point.
 * Checks JWT authentication and redirects unauthenticated users to /login.
 */
export function middleware(request: NextRequest): NextResponse {
  const token = request.cookies.get("token")?.value;
  const result = handleMiddleware(request.nextUrl.pathname, token, verifyToken);

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
