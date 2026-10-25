import {
  isHistoryEmpty,
  formatHistoryItem,
} from "@/components/calculator/History";
import type { HistoryItem, HistoryProps } from "@/components/calculator/History";

/**
 * Historyコンポーネントのロジックテスト。
 * DOMレンダリングに依存しない、export関数と型のテスト。
 */

describe("History", () => {
  describe("isHistoryEmpty", () => {
    describe("正常系: 履歴が存在する場合", () => {
      it("履歴が1件ある場合はfalseを返すこと", () => {
        const items: HistoryItem[] = [
          { expression: "1+2", result: "3" },
        ];
        expect(isHistoryEmpty(items)).toBe(false);
      });

      it("履歴が複数件ある場合はfalseを返すこと", () => {
        const items: HistoryItem[] = [
          { expression: "3×5", result: "15" },
          { expression: "1+2", result: "3" },
        ];
        expect(isHistoryEmpty(items)).toBe(false);
      });
    });

    describe("異常系: 履歴が空の場合", () => {
      it("空配列の場合はtrueを返すこと", () => {
        expect(isHistoryEmpty([])).toBe(true);
      });
    });
  });

  describe("formatHistoryItem", () => {
    describe("正常系: 数式と結果のペアが正しくフォーマットされること", () => {
      it("整数の計算結果をフォーマットすること", () => {
        const item: HistoryItem = { expression: "1+2", result: "3" };
        expect(formatHistoryItem(item)).toBe("1+2 = 3");
      });

      it("小数の計算結果をフォーマットすること", () => {
        const item: HistoryItem = { expression: "10÷3", result: "3.333" };
        expect(formatHistoryItem(item)).toBe("10÷3 = 3.333");
      });

      it("複雑な数式をフォーマットすること", () => {
        const item: HistoryItem = { expression: "12.5×3+7÷2", result: "41" };
        expect(formatHistoryItem(item)).toBe("12.5×3+7÷2 = 41");
      });

      it("負の結果をフォーマットすること", () => {
        const item: HistoryItem = { expression: "3-10", result: "-7" };
        expect(formatHistoryItem(item)).toBe("3-10 = -7");
      });
    });
  });

  describe("HistoryItem型", () => {
    it("正しいHistoryItemオブジェクトが型に適合すること", () => {
      const item: HistoryItem = {
        expression: "5+3",
        result: "8",
      };
      expect(item.expression).toBe("5+3");
      expect(item.result).toBe("8");
    });
  });

  describe("HistoryProps型", () => {
    it("空の履歴配列が型に適合すること", () => {
      const props: HistoryProps = {
        items: [],
      };
      expect(props.items).toHaveLength(0);
    });

    it("複数の履歴を持つpropsが型に適合すること", () => {
      const props: HistoryProps = {
        items: [
          { expression: "3×5", result: "15" },
          { expression: "1+2", result: "3" },
        ],
      };
      expect(props.items).toHaveLength(2);
    });
  });

  describe("計算履歴の時系列表示", () => {
    it("配列の先頭が最新の履歴であること（新しいものが上）", () => {
      // 時系列で追加していくシミュレーション
      const history: HistoryItem[] = [];

      // 1件目の計算
      const firstCalc: HistoryItem = { expression: "1+1", result: "2" };
      // 新しいものを先頭に追加
      history.unshift(firstCalc);

      // 2件目の計算
      const secondCalc: HistoryItem = { expression: "3×4", result: "12" };
      history.unshift(secondCalc);

      // 3件目の計算
      const thirdCalc: HistoryItem = { expression: "10-5", result: "5" };
      history.unshift(thirdCalc);

      // 最新の計算が先頭にあること
      expect(history[0]).toEqual({ expression: "10-5", result: "5" });
      expect(history[1]).toEqual({ expression: "3×4", result: "12" });
      expect(history[2]).toEqual({ expression: "1+1", result: "2" });
      expect(history).toHaveLength(3);
    });

    it("数式と結果のペアが正しく保持されること", () => {
      const items: HistoryItem[] = [
        { expression: "100÷4", result: "25" },
        { expression: "7+8", result: "15" },
      ];

      // 各アイテムの数式と結果のペアが正しいこと
      expect(items[0].expression).toBe("100÷4");
      expect(items[0].result).toBe("25");
      expect(items[1].expression).toBe("7+8");
      expect(items[1].result).toBe("15");
    });
  });
});
