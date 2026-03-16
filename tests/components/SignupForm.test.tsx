import { validateSignupForm, submitSignup } from "@/components/auth/SignupForm";

/**
 * SignupFormのバリデーションロジックとAPI送信ロジックのテスト。
 * DOMレンダリングに依存しないロジック単体のテスト。
 */

describe("SignupForm", () => {
  describe("validateSignupForm", () => {
    describe("正常系", () => {
      it("有効なユーザー名とパスワードでnullを返すこと", () => {
        const result = validateSignupForm("testuser", "password123");
        expect(result).toBeNull();
      });

      it("パスワードがちょうど8文字でnullを返すこと（境界値）", () => {
        const result = validateSignupForm("testuser", "12345678");
        expect(result).toBeNull();
      });
    });

    describe("異常系", () => {
      it("ユーザー名が空文字の場合エラーを返すこと", () => {
        const result = validateSignupForm("", "password123");
        expect(result).toBe("Username is required");
      });

      it("ユーザー名がスペースのみの場合エラーを返すこと", () => {
        const result = validateSignupForm("   ", "password123");
        expect(result).toBe("Username is required");
      });

      it("パスワードが8文字未満の場合エラーを返すこと", () => {
        const result = validateSignupForm("testuser", "short");
        expect(result).toBe("Password must be at least 8 characters");
      });

      it("パスワードが7文字の場合エラーを返すこと（境界値）", () => {
        const result = validateSignupForm("testuser", "1234567");
        expect(result).toBe("Password must be at least 8 characters");
      });

      it("パスワードが空文字の場合エラーを返すこと", () => {
        const result = validateSignupForm("testuser", "");
        expect(result).toBe("Password must be at least 8 characters");
      });
    });
  });

  describe("submitSignup", () => {
    describe("正常系: 登録成功時", () => {
      it("成功レスポンスで { success: true } を返すこと", async () => {
        // 成功レスポンスを返すモックfetch
        const mockFetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ message: "User created successfully" }),
        });

        const result = await submitSignup("testuser", "password123", mockFetch as unknown as typeof fetch);

        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "testuser", password: "password123" }),
        });
      });
    });

    describe("異常系: 登録失敗時", () => {
      it("APIがエラーを返した場合 { success: false, error } を返すこと", async () => {
        // エラーレスポンスを返すモックfetch
        const mockFetch = jest.fn().mockResolvedValue({
          ok: false,
          json: async () => ({ error: "Username already exists" }),
        });

        const result = await submitSignup("existinguser", "password123", mockFetch as unknown as typeof fetch);

        expect(result).toEqual({ success: false, error: "Username already exists" });
      });

      it("パスワード要件未満のエラーが返されること", async () => {
        // バリデーションエラーレスポンスを返すモックfetch
        const mockFetch = jest.fn().mockResolvedValue({
          ok: false,
          json: async () => ({ error: "Password must be at least 8 characters" }),
        });

        const result = await submitSignup("testuser", "short", mockFetch as unknown as typeof fetch);

        expect(result).toEqual({
          success: false,
          error: "Password must be at least 8 characters",
        });
      });

      it("エラーメッセージがない場合デフォルトメッセージを返すこと", async () => {
        // エラーメッセージなしのレスポンスを返すモックfetch
        const mockFetch = jest.fn().mockResolvedValue({
          ok: false,
          json: async () => ({}),
        });

        const result = await submitSignup("testuser", "password123", mockFetch as unknown as typeof fetch);

        expect(result).toEqual({ success: false, error: "Registration failed" });
      });
    });

    describe("リクエスト形式", () => {
      it("正しいエンドポイントとヘッダーでリクエストが送信されること", async () => {
        const mockFetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ message: "User created successfully" }),
        });

        await submitSignup("myuser", "mypassword123", mockFetch as unknown as typeof fetch);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toBe("/api/auth/signup");
        expect(options.method).toBe("POST");
        expect(options.headers["Content-Type"]).toBe("application/json");

        const body = JSON.parse(options.body);
        expect(body.username).toBe("myuser");
        expect(body.password).toBe("mypassword123");
      });
    });
  });
});
