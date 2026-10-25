import { handleCalculate } from "@/app/api/calculate/route";

/**
 * フェイクのトークン検証: "valid-token" のみ認証成功とする
 */
function fakeVerifyToken(token: string): unknown {
  if (token === "valid-token") {
    return { userId: "user-1", email: "testuser", iat: 0, exp: 9999999999 };
  }
  return null;
}

describe("POST /api/calculate", () => {
  // ----- 正常系テスト -----
  describe("正常系: 認証済みユーザーが正しい数式を送信", () => {
    it("足し算が正しく計算されること", () => {
      const result = handleCalculate(
        { expression: "3 + 5" },
        "valid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ expression: "3 + 5", result: 8 });
    });

    it("四則演算の優先順位を考慮した計算結果が返ること", () => {
      const result = handleCalculate(
        { expression: "3 + 5 * 2" },
        "valid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ expression: "3 + 5 * 2", result: 13 });
    });

    it("小数を含む計算が正しく処理されること", () => {
      const result = handleCalculate(
        { expression: "1.5 + 2.5" },
        "valid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ expression: "1.5 + 2.5", result: 4 });
    });

    it("減算が正しく計算されること", () => {
      const result = handleCalculate(
        { expression: "10 - 3" },
        "valid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ expression: "10 - 3", result: 7 });
    });

    it("除算が正しく計算されること", () => {
      const result = handleCalculate(
        { expression: "10 / 4" },
        "valid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ expression: "10 / 4", result: 2.5 });
    });
  });

  // ----- 異常系: 未認証ユーザー -----
  describe("異常系: 未認証ユーザーが401エラーを受けること", () => {
    it("トークンなしで401エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "1 + 1" },
        undefined,
        fakeVerifyToken
      );

      expect(result.status).toBe(401);
      expect(result.body).toEqual({ error: "Unauthorized" });
    });

    it("無効なトークンで401エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "1 + 1" },
        "invalid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(401);
      expect(result.body).toEqual({ error: "Unauthorized" });
    });
  });

  // ----- 異常系: 不正な数式 -----
  describe("異常系: 不正な数式で400エラーが返ること", () => {
    it("アルファベットを含む数式で400エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "abc + 1" },
        "valid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("error");
    });

    it("不完全な数式で400エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "3 +" },
        "valid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("error");
    });

    it("演算子が連続する数式で400エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "3 ++ 5" },
        "valid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("error");
    });
  });

  // ----- 異常系: ゼロ除算 -----
  describe("異常系: ゼロ除算で400エラーが返ること", () => {
    it("直接のゼロ除算で400エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "10 / 0" },
        "valid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toEqual({ error: "Division by zero" });
    });
  });

  // ----- 異常系: 数式が空 -----
  describe("異常系: 数式が空で400エラーが返ること", () => {
    it("expressionが空文字列で400エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "" },
        "valid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toEqual({ error: "Empty expression" });
    });

    it("expressionが空白のみで400エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "   " },
        "valid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("error");
    });

    it("expressionプロパティが存在しない場合400エラーが返ること", () => {
      const result = handleCalculate(
        {},
        "valid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toEqual({ error: "Empty expression" });
    });

    it("expressionがnullの場合400エラーが返ること", () => {
      const result = handleCalculate(
        { expression: null },
        "valid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toEqual({ error: "Empty expression" });
    });
  });
});
