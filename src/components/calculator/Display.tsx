import styles from "./Display.module.css";

/** Displayコンポーネントのprops型定義 */
export interface DisplayProps {
  /** 現在の数式文字列 */
  expression: string;
  /** 計算結果文字列（未計算時は空文字） */
  result: string;
}

/**
 * 数式表示エリアのフォーマット処理。
 * 空文字の場合はプレースホルダーテキストを返す。
 */
export function formatExpression(expression: string): string {
  return expression || "0";
}

/**
 * 結果表示エリアのフォーマット処理。
 * 空文字の場合は空のまま返す（未計算状態を表現）。
 */
export function formatResult(result: string): string {
  return result;
}

/**
 * 電卓ディスプレイコンポーネント。
 * 入力中の数式と計算結果を表示する。
 */
export default function Display({ expression, result }: DisplayProps) {
  return (
    <div className={styles.display} role="status" aria-label="Calculator display">
      {/* 数式表示エリア */}
      <div className={styles.expression} aria-label="Expression">
        {formatExpression(expression)}
      </div>
      {/* 結果表示エリア */}
      <div className={styles.result} aria-label="Result">
        {formatResult(result)}
      </div>
    </div>
  );
}
