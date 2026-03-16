"use client";

import styles from "./Button.module.css";

/** ボタンのバリアント（種類）型定義 */
export type ButtonVariant = "number" | "operator" | "action" | "equal";

/** Buttonコンポーネントのprops型定義 */
export interface ButtonProps {
  /** ボタンに表示するラベル */
  label: string;
  /** クリック時のハンドラ */
  onClick: (label: string) => void;
  /** ボタンの種類（デフォルト: 'number'） */
  variant?: ButtonVariant;
}

/**
 * ボタンラベルからデフォルトのvariantを推定する。
 * 数字・小数点は'number'、演算子は'operator'、C/CEは'action'、=は'equal'。
 */
export function getDefaultVariant(label: string): ButtonVariant {
  if (label === "=") {
    return "equal";
  }
  if (label === "C" || label === "CE") {
    return "action";
  }
  if (["+", "-", "×", "÷"].includes(label)) {
    return "operator";
  }
  return "number";
}

/**
 * ボタンラベルからaria-label用の説明テキストを生成する。
 * アクセシビリティのために演算子記号を読みやすいテキストに変換する。
 */
export function getAriaLabel(label: string): string {
  const ariaLabelMap: Record<string, string> = {
    "+": "Add",
    "-": "Subtract",
    "×": "Multiply",
    "÷": "Divide",
    "=": "Equals",
    "C": "Clear all",
    "CE": "Clear last entry",
    ".": "Decimal point",
  };
  return ariaLabelMap[label] || label;
}

/**
 * 電卓ボタンコンポーネント。
 * 数字・演算子・アクション・実行の各種ボタンを表示する。
 * variantに応じてスタイルが変わる。
 */
export default function Button({ label, onClick, variant }: ButtonProps) {
  // variantが指定されていない場合はラベルから推定
  const resolvedVariant = variant ?? getDefaultVariant(label);

  // variant に応じた CSS クラスを決定
  const className = [
    styles.button,
    styles[resolvedVariant],
  ].join(" ");

  return (
    <button
      className={className}
      onClick={() => onClick(label)}
      aria-label={getAriaLabel(label)}
      type="button"
    >
      {label}
    </button>
  );
}
