import { describe, it, expect } from "@jest/globals";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password", () => {
  describe("hashPassword", () => {
    it("should return a bcrypt hash string", async () => {
      const hash = await hashPassword("testPassword123");
      // bcrypt hashes start with $2a$ or $2b$
      expect(hash).toMatch(/^\$2[ab]\$/);
    });

    it("should produce different hashes for the same password (salt)", async () => {
      const hash1 = await hashPassword("samePassword");
      const hash2 = await hashPassword("samePassword");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should return true for a correct password", async () => {
      const password = "correctPassword123";
      const hash = await hashPassword(password);
      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it("should return false for an incorrect password", async () => {
      const hash = await hashPassword("correctPassword123");
      const result = await verifyPassword("wrongPassword", hash);
      expect(result).toBe(false);
    });

    it("should return false for an empty password against a valid hash", async () => {
      const hash = await hashPassword("somePassword");
      const result = await verifyPassword("", hash);
      expect(result).toBe(false);
    });
  });
});
