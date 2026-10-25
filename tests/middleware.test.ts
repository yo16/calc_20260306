// jose はESMモジュールのためJest環境でモックする
jest.mock("jose", () => ({
  jwtVerify: jest.fn(),
}));

import { handleMiddleware, isPublicPath } from "@/middleware";

/**
 * Fake token verifier: returns a payload for "valid-token", null otherwise.
 */
async function fakeVerifyToken(token: string): Promise<unknown> {
  if (token === "valid-token") {
    return { userId: "user-1", email: "test@example.com", iat: 1000, exp: 9999 };
  }
  return null;
}

describe("isPublicPath", () => {
  it("should return true for /login", () => {
    expect(isPublicPath("/login")).toBe(true);
  });

  it("should return true for /signup", () => {
    expect(isPublicPath("/signup")).toBe(true);
  });

  it("should return true for /api/auth/ paths", () => {
    expect(isPublicPath("/api/auth/login")).toBe(true);
    expect(isPublicPath("/api/auth/signup")).toBe(true);
    expect(isPublicPath("/api/auth/logout")).toBe(true);
  });

  it("should return false for protected paths", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/calculator")).toBe(false);
    expect(isPublicPath("/api/calculate")).toBe(false);
  });
});

describe("handleMiddleware", () => {
  describe("Normal cases", () => {
    it("should allow access to protected pages with a valid JWT cookie", async () => {
      const result = await handleMiddleware("/calculator", "valid-token", fakeVerifyToken);
      expect(result.action).toBe("next");
    });

    it("should allow access to /login without authentication", async () => {
      const result = await handleMiddleware("/login", undefined, fakeVerifyToken);
      expect(result.action).toBe("next");
    });

    it("should allow access to /signup without authentication", async () => {
      const result = await handleMiddleware("/signup", undefined, fakeVerifyToken);
      expect(result.action).toBe("next");
    });

    it("should allow access to /api/auth/ paths without authentication", async () => {
      const result = await handleMiddleware("/api/auth/login", undefined, fakeVerifyToken);
      expect(result.action).toBe("next");
    });

    it("should allow access to public paths even with a valid token", async () => {
      const result = await handleMiddleware("/login", "valid-token", fakeVerifyToken);
      expect(result.action).toBe("next");
    });
  });

  describe("Error cases", () => {
    it("should redirect to /login when JWT cookie is missing", async () => {
      const result = await handleMiddleware("/calculator", undefined, fakeVerifyToken);
      expect(result).toEqual({ action: "redirect", destination: "/login" });
    });

    it("should redirect to /login when JWT cookie is invalid", async () => {
      const result = await handleMiddleware("/calculator", "invalid-token", fakeVerifyToken);
      expect(result).toEqual({ action: "redirect", destination: "/login" });
    });

    it("should redirect to /login when JWT cookie is expired (verifier returns null)", async () => {
      const result = await handleMiddleware("/calculator", "expired-token", fakeVerifyToken);
      expect(result).toEqual({ action: "redirect", destination: "/login" });
    });

    it("should redirect to /login for root path without authentication", async () => {
      const result = await handleMiddleware("/", undefined, fakeVerifyToken);
      expect(result).toEqual({ action: "redirect", destination: "/login" });
    });

    it("should redirect to /login for /api/calculate without authentication", async () => {
      const result = await handleMiddleware("/api/calculate", undefined, fakeVerifyToken);
      expect(result).toEqual({ action: "redirect", destination: "/login" });
    });
  });
});
