import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import jwt from "jsonwebtoken";
import { generateToken, verifyToken } from "@/lib/auth/jwt";

const TEST_SECRET = "test-jwt-secret-key-for-testing";

describe("jwt", () => {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env = { ...originalEnv, JWT_SECRET: TEST_SECRET };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("generateToken", () => {
    it("should generate a valid JWT with the correct payload", () => {
      const payload = { userId: "user-1", email: "test@example.com" };
      const token = generateToken(payload);

      const decoded = jwt.verify(token, TEST_SECRET) as Record<string, unknown>;
      expect(decoded.userId).toBe("user-1");
      expect(decoded.email).toBe("test@example.com");
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it("should respect JWT_EXPIRES_IN env variable", () => {
      process.env.JWT_EXPIRES_IN = "1h";
      const payload = { userId: "user-1", email: "test@example.com" };
      const token = generateToken(payload);

      const decoded = jwt.verify(token, TEST_SECRET) as Record<string, unknown>;
      const iat = decoded.iat as number;
      const exp = decoded.exp as number;
      // 1h = 3600 seconds
      expect(exp - iat).toBe(3600);

      // Reset
      delete process.env.JWT_EXPIRES_IN;
    });

    it("should default to 24h expiration when JWT_EXPIRES_IN is not set", () => {
      delete process.env.JWT_EXPIRES_IN;
      const payload = { userId: "user-1", email: "test@example.com" };
      const token = generateToken(payload);

      const decoded = jwt.verify(token, TEST_SECRET) as Record<string, unknown>;
      const iat = decoded.iat as number;
      const exp = decoded.exp as number;
      // 24h = 86400 seconds
      expect(exp - iat).toBe(86400);
    });
  });

  describe("verifyToken", () => {
    it("should return decoded payload for a valid token", () => {
      const payload = { userId: "user-1", email: "test@example.com" };
      const token = generateToken(payload);

      const result = verifyToken(token);
      expect(result).not.toBeNull();
      expect(result!.userId).toBe("user-1");
      expect(result!.email).toBe("test@example.com");
      expect(result!.iat).toBeDefined();
      expect(result!.exp).toBeDefined();
    });

    it("should return null for an expired token", () => {
      // Create a token that expired 1 second ago
      const token = jwt.sign(
        { userId: "user-1", email: "test@example.com" },
        TEST_SECRET,
        { expiresIn: -1 }
      );

      const result = verifyToken(token);
      expect(result).toBeNull();
    });

    it("should return null for a token signed with a different secret", () => {
      const token = jwt.sign(
        { userId: "user-1", email: "test@example.com" },
        "different-secret",
        { expiresIn: "1h" }
      );

      const result = verifyToken(token);
      expect(result).toBeNull();
    });

    it("should return null for a tampered token", () => {
      const token = generateToken({
        userId: "user-1",
        email: "test@example.com",
      });

      // Tamper with the payload portion (second segment)
      const parts = token.split(".");
      parts[1] = parts[1] + "tampered";
      const tamperedToken = parts.join(".");

      const result = verifyToken(tamperedToken);
      expect(result).toBeNull();
    });

    it("should return null for a completely invalid token string", () => {
      const result = verifyToken("not-a-valid-token");
      expect(result).toBeNull();
    });
  });

  describe("missing JWT_SECRET", () => {
    it("should throw an error when JWT_SECRET is not set", () => {
      const savedSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() =>
        generateToken({ userId: "user-1", email: "test@example.com" })
      ).toThrow("JWT_SECRET environment variable is not set");

      process.env.JWT_SECRET = savedSecret;
    });
  });
});
