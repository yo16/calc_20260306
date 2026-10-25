import { getDefaultVariant, getAriaLabel } from "@/components/calculator/Button";
import type { ButtonProps, ButtonVariant } from "@/components/calculator/Button";

/**
 * Buttonコンポーネントのロジックテスト。
 * DOMレンダリングに依存しない、export関数と型のテスト。
 */

describe("Button", () => {
  describe("getDefaultVariant", () => {
    describe("数字ボタン", () => {
      it.each(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])(
        "数字 '%s' で 'number' を返すこと",
        (label) => {
          expect(getDefaultVariant(label)).toBe("number");
        }
      );

      it("小数点 '.' で 'number' を返すこと", () => {
        expect(getDefaultVariant(".")).toBe("number");
      });
    });

    describe("演算子ボタン", () => {
      it.each([
        ["+", "operator"],
        ["-", "operator"],
        ["×", "operator"],
        ["÷", "operator"],
      ] as [string, ButtonVariant][])(
        "演算子 '%s' で '%s' を返すこと",
        (label, expected) => {
          expect(getDefaultVariant(label)).toBe(expected);
        }
      );
    });

    describe("アクションボタン", () => {
      it("'C' で 'action' を返すこと（全クリア）", () => {
        expect(getDefaultVariant("C")).toBe("action");
      });

      it("'CE' で 'action' を返すこと（直前削除）", () => {
        expect(getDefaultVariant("CE")).toBe("action");
      });
    });

    describe("等号ボタン", () => {
      it("'=' で 'equal' を返すこと", () => {
        expect(getDefaultVariant("=")).toBe("equal");
      });
    });
  });

  describe("getAriaLabel", () => {
    describe("演算子のアクセシビリティラベル", () => {
      it("'+' で 'Add' を返すこと", () => {
        expect(getAriaLabel("+")).toBe("Add");
      });

      it("'-' で 'Subtract' を返すこと", () => {
        expect(getAriaLabel("-")).toBe("Subtract");
      });

      it("'×' で 'Multiply' を返すこと", () => {
        expect(getAriaLabel("×")).toBe("Multiply");
      });

      it("'÷' で 'Divide' を返すこと", () => {
        expect(getAriaLabel("÷")).toBe("Divide");
      });
    });

    describe("特殊ボタンのアクセシビリティラベル", () => {
      it("'=' で 'Equals' を返すこと", () => {
        expect(getAriaLabel("=")).toBe("Equals");
      });

      it("'C' で 'Clear all' を返すこと", () => {
        expect(getAriaLabel("C")).toBe("Clear all");
      });

      it("'CE' で 'Clear last entry' を返すこと", () => {
        expect(getAriaLabel("CE")).toBe("Clear last entry");
      });

      it("'.' で 'Decimal point' を返すこと", () => {
        expect(getAriaLabel(".")).toBe("Decimal point");
      });
    });

    describe("数字ボタンのアクセシビリティラベル", () => {
      it.each(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])(
        "数字 '%s' はラベルをそのまま返すこと",
        (label) => {
          expect(getAriaLabel(label)).toBe(label);
        }
      );
    });
  });

  describe("ButtonProps型", () => {
    it("必須propsが正しく型に適合すること", () => {
      const handler = jest.fn();
      const props: ButtonProps = {
        label: "5",
        onClick: handler,
      };
      expect(props.label).toBe("5");
      expect(typeof props.onClick).toBe("function");
      expect(props.variant).toBeUndefined();
    });

    it("variantを含むpropsが型に適合すること", () => {
      const handler = jest.fn();
      const props: ButtonProps = {
        label: "+",
        onClick: handler,
        variant: "operator",
      };
      expect(props.variant).toBe("operator");
    });

    it("onClickハンドラがラベルを引数に受け取る型であること", () => {
      const handler = jest.fn();
      const props: ButtonProps = {
        label: "7",
        onClick: handler,
      };
      // onClickをラベル付きで呼び出す
      props.onClick(props.label);
      expect(handler).toHaveBeenCalledWith("7");
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("C（全クリア）とCE（直前削除）の区別", () => {
    it("CとCEがどちらも'action'バリアントであること", () => {
      expect(getDefaultVariant("C")).toBe("action");
      expect(getDefaultVariant("CE")).toBe("action");
    });

    it("CとCEが異なるaria-labelを持つこと", () => {
      expect(getAriaLabel("C")).not.toBe(getAriaLabel("CE"));
      expect(getAriaLabel("C")).toBe("Clear all");
      expect(getAriaLabel("CE")).toBe("Clear last entry");
    });
  });
});
