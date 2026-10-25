import { describe, it, expect } from "@jest/globals";
import { calculate, CalculateResult } from "@/lib/calculator/engine";

/**
 * 計算結果がsuccessかどうかを判定するヘルパー
 */
function isSuccess(result: CalculateResult): result is { expression: string; result: number } {
  return "result" in result;
}

/**
 * 計算結果がerrorかどうかを判定するヘルパー
 */
function isError(result: CalculateResult): result is { error: string } {
  return "error" in result;
}

describe("calculator engine", () => {
  // 正常系: 単純な四則演算
  describe("基本的な四則演算", () => {
    it("加算: 3+5=8", () => {
      const result = calculate("3+5");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(8);
      }
    });

    it("減算: 10-3=7", () => {
      const result = calculate("10-3");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(7);
      }
    });

    it("乗算: 4*5=20", () => {
      const result = calculate("4*5");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(20);
      }
    });

    it("除算: 10/2=5", () => {
      const result = calculate("10/2");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(5);
      }
    });
  });

  // 正常系: 演算子の優先順位
  describe("演算子の優先順位", () => {
    it("3+5*2=13 (*が+より優先)", () => {
      const result = calculate("3+5*2");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(13);
      }
    });

    it("2*3+4=10 (*が+より優先)", () => {
      const result = calculate("2*3+4");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(10);
      }
    });

    it("10-2*3=4 (*が-より優先)", () => {
      const result = calculate("10-2*3");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(4);
      }
    });

    it("8/2+3=7 (/が+より優先)", () => {
      const result = calculate("8/2+3");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(7);
      }
    });
  });

  // 正常系: 小数演算
  describe("小数演算", () => {
    it("1.5+2.5=4", () => {
      const result = calculate("1.5+2.5");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(4);
      }
    });

    it("0.1+0.2が約0.3になること", () => {
      const result = calculate("0.1+0.2");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBeCloseTo(0.3, 10);
      }
    });

    it("3.14*2=6.28", () => {
      const result = calculate("3.14*2");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBeCloseTo(6.28, 10);
      }
    });
  });

  // 正常系: 複数演算子の連続
  describe("複数演算子の連続", () => {
    it("1+2+3+4=10", () => {
      const result = calculate("1+2+3+4");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(10);
      }
    });

    it("100-10-20-30=40", () => {
      const result = calculate("100-10-20-30");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(40);
      }
    });

    it("2*3*4=24", () => {
      const result = calculate("2*3*4");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(24);
      }
    });

    it("1+2*3+4*5=27 (複合)", () => {
      const result = calculate("1+2*3+4*5");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(27);
      }
    });
  });

  // 正常系: スペースを含む数式
  describe("スペースを含む数式", () => {
    it("3 + 5 * 2 = 13", () => {
      const result = calculate("3 + 5 * 2");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(13);
      }
    });
  });

  // 正常系: expressionプロパティが元の式を返すこと
  describe("戻り値の構造", () => {
    it("成功時にexpression と result が返ること", () => {
      const result = calculate("3+5");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.expression).toBe("3+5");
        expect(result.result).toBe(8);
      }
    });

    it("エラー時にerrorが返ること", () => {
      const result = calculate("");
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error).toBeDefined();
      }
    });
  });

  // 異常系: ゼロ除算
  describe("ゼロ除算", () => {
    it("10/0 でエラーが返ること", () => {
      const result = calculate("10/0");
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error).toBe("Division by zero");
      }
    });

    it("5+10/0 でエラーが返ること", () => {
      const result = calculate("5+10/0");
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error).toBe("Division by zero");
      }
    });
  });

  // 異常系: 不正な文字列
  describe("不正な文字列", () => {
    it("アルファベットを含む式でエラーが返ること", () => {
      const result = calculate("3+abc");
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error).toBe("Invalid characters in expression");
      }
    });

    it("特殊文字を含む式でエラーが返ること", () => {
      const result = calculate("3+5;drop table");
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error).toBe("Invalid characters in expression");
      }
    });

    it("括弧を含む式でエラーが返ること（現在未対応）", () => {
      const result = calculate("(3+5)*2");
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error).toBe("Invalid characters in expression");
      }
    });
  });

  // 異常系: 空文字列
  describe("空文字列", () => {
    it("空文字列でエラーが返ること", () => {
      const result = calculate("");
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error).toBe("Empty expression");
      }
    });

    it("スペースのみでエラーが返ること", () => {
      const result = calculate("   ");
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error).toBe("Empty expression");
      }
    });
  });

  // 異常系: 不正な数式構造
  describe("不正な数式構造", () => {
    it("演算子のみでエラーが返ること", () => {
      const result = calculate("+");
      expect(isError(result)).toBe(true);
    });

    it("演算子が連続する式でエラーが返ること", () => {
      const result = calculate("3++5");
      expect(isError(result)).toBe(true);
    });

    it("式の末尾が演算子でエラーが返ること", () => {
      const result = calculate("3+5+");
      expect(isError(result)).toBe(true);
    });
  });

  // 境界値: 最大文字数（100文字）
  describe("最大文字数制限", () => {
    it("100文字ちょうどの数式が計算できること", () => {
      // 100文字の有効な数式を生成: "1+1+1+...+1+11"
      // "1" (1文字) + "+1" * 48 (96文字) + "+11" (3文字) = 100文字
      // 結果: 1 + 48 + 11 = 60
      const parts: string[] = ["1"];
      for (let i = 0; i < 48; i++) {
        parts.push("+1");
      }
      parts.push("+11");
      const expression = parts.join("");
      expect(expression.length).toBe(100);

      const result = calculate(expression);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(60);
      }
    });

    it("101文字の数式でエラーが返ること", () => {
      // 101文字の数式を生成
      const expression = "1+" + "1+".repeat(49) + "1";
      // 実際に101文字以上であることを確認して調整
      const longExpression = "1".repeat(101);
      expect(longExpression.length).toBe(101);

      const result = calculate(longExpression);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error).toContain("maximum length");
      }
    });
  });

  // 境界値: 非常に大きな数値
  describe("非常に大きな数値", () => {
    it("大きな数値の計算ができること", () => {
      const result = calculate("999999999*999999999");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBe(999999999 * 999999999);
      }
    });

    it("非常に小さな数値の計算ができること", () => {
      const result = calculate("0.0001+0.0002");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.result).toBeCloseTo(0.0003, 10);
      }
    });
  });
});
