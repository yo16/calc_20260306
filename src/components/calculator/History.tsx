import styles from "./History.module.css";

/** 計算履歴の1件分のデータ型 */
export interface HistoryItem {
  /** 計算に使った数式 */
  expression: string;
  /** 計算結果 */
  result: string;
}

/** Historyコンポーネントのprops型定義 */
export interface HistoryProps {
  /** 計算履歴の配列（新しいものが先頭） */
  items: HistoryItem[];
}

/**
 * 履歴が空かどうかを判定する。
 */
export function isHistoryEmpty(items: HistoryItem[]): boolean {
  return items.length === 0;
}

/**
 * 履歴アイテムの表示テキストを生成する。
 * 「数式 = 結果」の形式で返す。
 */
export function formatHistoryItem(item: HistoryItem): string {
  return `${item.expression} = ${item.result}`;
}

/**
 * 計算履歴コンポーネント。
 * 計算結果の履歴を時系列（新しいものが上）でリスト表示する。
 * 履歴が空の場合は案内メッセージを表示する。
 */
export default function History({ items }: HistoryProps) {
  return (
    <div className={styles.history} aria-label="Calculation history">
      {/* セクションタイトル */}
      <h2 className={styles.title}>History</h2>

      {/* 履歴が空の場合のメッセージ */}
      {isHistoryEmpty(items) && (
        <p className={styles.empty}>No calculations yet</p>
      )}

      {/* 履歴リスト（新しいものが上） */}
      {!isHistoryEmpty(items) && (
        <ul className={styles.list}>
          {items.map((item, index) => (
            <li key={index} className={styles.item}>
              {/* 数式部分 */}
              <span className={styles.expression}>{item.expression}</span>
              {/* イコール記号 */}
              <span className={styles.equals}>=</span>
              {/* 結果部分 */}
              <span className={styles.result}>{item.result}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
