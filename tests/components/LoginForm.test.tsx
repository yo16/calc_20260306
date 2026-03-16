import { validateLoginForm, submitLogin } from "@/components/auth/LoginForm";

/**
 * LoginFormのバリデーションロジックとAPI送信ロジックのテスト。
 * DOMレンダリングに依存しないロジック単体のテスト。
 */

describe("LoginForm", () => {
  describe("validateLoginForm", () => {
    describe("正常系", () => {
      it("有効なユーザー名とパスワードでnullを返すこと", () => {
        const result = validateLoginForm("testuser", "password123");
        expect(result).toBeNull();
      });

      it("短いパスワードでもバリデーションが通ること（ログインではパスワード長チェック不要）", () => {
        const result = validateLoginForm("testuser", "abc");
        expect(result).toBeNull();
      });
    });

    describe("異常系", () => {
      it("ユーザー名が空文字の場合エラーを返すこと", () => {
        const result = validateLoginForm("", "password123");
        expect(result).toBe("Username is required");
      });

      it("ユーザー名がスペースのみの場合エラーを返すこと", () => {
        const result = validateLoginForm("   ", "password123");
        expect(result).toBe("Username is required");
      });

      it("パスワードが空文字の場合エラーを返すこと", () => {
        const result = validateLoginForm("testuser", "");
        expect(result).toBe("Password is required");
      });
    });
  });

  describe("submitLogin", () => {
    describe("正常系: ログイン成功時", () => {
      it("成功レスポンスで { success: true } を返すこと", async () => {
        // 成功レスポンスを返すモックfetch
        const mockFetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ message: "Login successful" }),
        });

        const result = await submitLogin("testuser", "password123", mockFetch as unknown as typeof fetch);

        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "testuser", password: "password123" }),
        });
      });
    });

    describe("異常系: ログイン失敗時", () => {
      it("認証エラーの場合 { success: false, error } を返すこと", async () => {
        // エラーレスポンスを返すモックfetch
        const mockFetch = jest.fn().mockResolvedValue({
          ok: false,
          json: async () => ({ error: "Invalid credentials" }),
        });

        const result = await submitLogin("wronguser", "wrongpass", mockFetch as unknown as typeof fetch);

        expect(result).toEqual({ success: false, error: "Invalid credentials" });
      });

      it("エラーメッセージがない場合デフォルトメッセージを返すこと", async () => {
        // エラーメッセージなしのレスポンスを返すモックfetch
        const mockFetch = jest.fn().mockResolvedValue({
          ok: false,
          json: async () => ({}),
        });

        const result = await submitLogin("testuser", "password123", mockFetch as unknown as typeof fetch);

        expect(result).toEqual({ success: false, error: "Login failed" });
      });

      it("サーバーエラーの場合エラーメッセージを返すこと", async () => {
        // 500エラーレスポンスを返すモックfetch
        const mockFetch = jest.fn().mockResolvedValue({
          ok: false,
          json: async () => ({ error: "Internal server error" }),
        });

        const result = await submitLogin("testuser", "password123", mockFetch as unknown as typeof fetch);

        expect(result).toEqual({ success: false, error: "Internal server error" });
      });
    });

    describe("リクエスト形式", () => {
      it("正しいエンドポイントとヘッダーでリクエストが送信されること", async () => {
        const mockFetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ message: "Login successful" }),
        });

        await submitLogin("myuser", "mypassword123", mockFetch as unknown as typeof fetch);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toBe("/api/auth/login");
        expect(options.method).toBe("POST");
        expect(options.headers["Content-Type"]).toBe("application/json");

        const body = JSON.parse(options.body);
        expect(body.username).toBe("myuser");
        expect(body.password).toBe("mypassword123");
      });
    });
  });
});
