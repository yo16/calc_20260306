import { formatExpression, formatResult } from "@/components/calculator/Display";
import type { DisplayProps } from "@/components/calculator/Display";

/**
 * Displayコンポーネントのロジックテスト。
 * DOMレンダリングに依存しない、export関数と型のテスト。
 */

describe("Display", () => {
  describe("formatExpression", () => {
    describe("正常系", () => {
      it("数式文字列をそのまま返すこと", () => {
        expect(formatExpression("1+2")).toBe("1+2");
      });

      it("複雑な数式もそのまま返すこと", () => {
        expect(formatExpression("12.5×3+7÷2")).toBe("12.5×3+7÷2");
      });

      it("単一の数字をそのまま返すこと", () => {
        expect(formatExpression("5")).toBe("5");
      });

      it("小数点を含む数式をそのまま返すこと", () => {
        expect(formatExpression("3.14+2.86")).toBe("3.14+2.86");
      });
    });

    describe("空文字の場合", () => {
      it("空文字の場合はプレースホルダー '0' を返すこと", () => {
        expect(formatExpression("")).toBe("0");
      });
    });
  });

  describe("formatResult", () => {
    describe("正常系", () => {
      it("結果文字列をそのまま返すこと", () => {
        expect(formatResult("42")).toBe("42");
      });

      it("小数結果をそのまま返すこと", () => {
        expect(formatResult("3.14")).toBe("3.14");
      });

      it("負の数の結果をそのまま返すこと", () => {
        expect(formatResult("-5")).toBe("-5");
      });

      it("エラーメッセージもそのまま返すこと", () => {
        expect(formatResult("Error: Division by zero")).toBe("Error: Division by zero");
      });
    });

    describe("未計算時", () => {
      it("空文字の場合は空文字を返すこと", () => {
        expect(formatResult("")).toBe("");
      });
    });
  });

  describe("DisplayProps型", () => {
    it("正しいpropsオブジェクトが型に適合すること", () => {
      // 型チェックのためのコンパイルテスト
      const props: DisplayProps = {
        expression: "1+2",
        result: "3",
      };
      expect(props.expression).toBe("1+2");
      expect(props.result).toBe("3");
    });

    it("結果が空文字のpropsが型に適合すること（未計算状態）", () => {
      const props: DisplayProps = {
        expression: "1+2",
        result: "",
      };
      expect(props.expression).toBe("1+2");
      expect(props.result).toBe("");
    });

    it("数式も結果も空文字のpropsが型に適合すること（初期状態）", () => {
      const props: DisplayProps = {
        expression: "",
        result: "",
      };
      expect(props.expression).toBe("");
      expect(props.result).toBe("");
    });
  });
});
