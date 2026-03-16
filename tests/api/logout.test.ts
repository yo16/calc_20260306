import { handleLogout } from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  describe("Normal cases", () => {
    it("should return 200 with success message", () => {
      const result = handleLogout();

      expect(result.status).toBe(200);
      expect(result.body.message).toBe("Logged out successfully");
    });

    it("should set cookie with maxAge=0 to clear it", () => {
      const result = handleLogout();

      expect(result.cookie).toBeDefined();
      expect(result.cookie.name).toBe("token");
      expect(result.cookie.value).toBe("");
      expect(result.cookie.options.maxAge).toBe(0);
    });

    it("should set cookie with httpOnly, secure, and sameSite=strict", () => {
      const result = handleLogout();

      expect(result.cookie.options.httpOnly).toBe(true);
      expect(result.cookie.options.secure).toBe(true);
      expect(result.cookie.options.sameSite).toBe("strict");
    });

    it("should set cookie path to /", () => {
      const result = handleLogout();

      expect(result.cookie.options.path).toBe("/");
    });
  });
});
