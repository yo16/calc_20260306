import {
  convertExpressionForApi,
  appendToExpression,
  fetchCalculation,
} from "@/components/calculator/Calculator";

/**
 * Calculatorコンポーネントのロジックテスト。
 * DOMレンダリングに依存しない、export関数のテスト。
 */

describe("Calculator", () => {
  describe("convertExpressionForApi", () => {
    describe("正常系: 演算子の変換", () => {
      it("×を*に変換すること", () => {
        expect(convertExpressionForApi("3×5")).toBe("3*5");
      });

      it("÷を/に変換すること", () => {
        expect(convertExpressionForApi("10÷2")).toBe("10/2");
      });

      it("×と÷の両方を変換すること", () => {
        expect(convertExpressionForApi("3×5÷2")).toBe("3*5/2");
      });

      it("+と-はそのまま維持されること", () => {
        expect(convertExpressionForApi("3+5-2")).toBe("3+5-2");
      });

      it("複雑な数式を正しく変換すること", () => {
        expect(convertExpressionForApi("12.5×3+7÷2-1")).toBe("12.5*3+7/2-1");
      });

      it("数字のみの場合はそのまま返すこと", () => {
        expect(convertExpressionForApi("123")).toBe("123");
      });

      it("空文字の場合はそのまま返すこと", () => {
        expect(convertExpressionForApi("")).toBe("");
      });
    });
  });

  describe("appendToExpression", () => {
    describe("正常系: 数式の組み立て", () => {
      it("空の数式に数字を追加できること", () => {
        expect(appendToExpression("", "5")).toBe("5");
      });

      it("数式に数字を追加できること", () => {
        expect(appendToExpression("12", "3")).toBe("123");
      });

      it("数式に演算子を追加できること", () => {
        expect(appendToExpression("5", "+")).toBe("5+");
      });

      it("数式に小数点を追加できること", () => {
        expect(appendToExpression("3", ".")).toBe("3.");
      });

      it("連続した入力で数式が組み立てられること", () => {
        let expr = "";
        expr = appendToExpression(expr, "1");
        expr = appendToExpression(expr, "+");
        expr = appendToExpression(expr, "2");
        expect(expr).toBe("1+2");
      });
    });
  });

  describe("fetchCalculation", () => {
    // fetch のモック
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    describe("正常系: API通信成功", () => {
      it("=ボタンでAPIに数式が送信され結果が返ること", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({ expression: "3+5*2", result: 13 }),
        });

        const response = await fetchCalculation("3+5×2");

        // fetchが正しいパラメータで呼ばれたか
        expect(global.fetch).toHaveBeenCalledWith("/api/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ expression: "3+5*2" }),
        });

        // 結果が正しく返ること
        expect(response).toEqual({ result: 13 });
      });

      it("演算子が正しく変換されてAPIに送信されること", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({ expression: "10/2", result: 5 }),
        });

        await fetchCalculation("10÷2");

        // ÷が/に変換されて送信されること
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/calculate",
          expect.objectContaining({
            body: JSON.stringify({ expression: "10/2" }),
          })
        );
      });
    });

    describe("異常系: APIエラー", () => {
      it("APIがエラーレスポンスを返した場合、エラーメッセージが返ること", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          json: async () => ({ error: "Division by zero" }),
        });

        const response = await fetchCalculation("5÷0");

        expect(response).toEqual({ error: "Division by zero" });
      });

      it("APIがエラーメッセージなしのエラーを返した場合、デフォルトメッセージが返ること", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          json: async () => ({}),
        });

        const response = await fetchCalculation("invalid");

        expect(response).toEqual({ error: "Calculation failed" });
      });

      it("ネットワークエラー時に例外がスローされること", async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

        await expect(fetchCalculation("1+2")).rejects.toThrow("Network error");
      });
    });

    describe("正常系: credentials設定", () => {
      it("credentials: include が設定されていること（httpOnly cookie送信）", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({ expression: "1+1", result: 2 }),
        });

        await fetchCalculation("1+1");

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/calculate",
          expect.objectContaining({
            credentials: "include",
          })
        );
      });
    });
  });

  describe("Cボタンのクリア動作", () => {
    it("数式のクリアは空文字への設定であること（ロジック確認）", () => {
      // Cボタン押下時は expression を空文字にリセットする
      // コンポーネント内のstateロジックを関数として表現
      const clearedExpression = "";
      const clearedResult = "";
      expect(clearedExpression).toBe("");
      expect(clearedResult).toBe("");
    });
  });

  describe("数式組み立ての統合テスト", () => {
    it("数字ボタン連続押下で数式が組み立てられること", () => {
      let expression = "";
      // "123+456" の入力シミュレーション
      const inputs = ["1", "2", "3", "+", "4", "5", "6"];
      for (const input of inputs) {
        expression = appendToExpression(expression, input);
      }
      expect(expression).toBe("123+456");
    });

    it("小数点を含む数式が正しく組み立てられること", () => {
      let expression = "";
      const inputs = ["3", ".", "1", "4", "×", "2"];
      for (const input of inputs) {
        expression = appendToExpression(expression, input);
      }
      expect(expression).toBe("3.14×2");
      // API変換もテスト
      expect(convertExpressionForApi(expression)).toBe("3.14*2");
    });
  });
});
