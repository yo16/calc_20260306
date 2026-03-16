"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Display from "./Display";
import Button from "./Button";
import History from "./History";
import type { HistoryItem } from "./History";
import styles from "./Calculator.module.css";

/** 電卓のボタンレイアウト定義（行ごとの配列） */
const BUTTON_ROWS: string[][] = [
  ["C", "CE", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
];

/** UI表示用の演算子を、API送信用の演算子に変換するマップ */
const OPERATOR_MAP: Record<string, string> = {
  "×": "*",
  "÷": "/",
};

/**
 * UI表示用の数式をAPI送信用に変換する。
 * ×→*、÷→/ に置換する。
 */
export function convertExpressionForApi(expression: string): string {
  let result = expression;
  for (const [display, api] of Object.entries(OPERATOR_MAP)) {
    result = result.split(display).join(api);
  }
  return result;
}

/**
 * ボタン押下時の数式更新ロジック。
 * 数字・演算子・小数点の場合は数式に追記する。
 */
export function appendToExpression(
  currentExpression: string,
  label: string
): string {
  return currentExpression + label;
}

/**
 * 計算APIへリクエストを送信し、結果を取得する。
 * credentials: 'include' でhttpOnly cookieを送信する。
 */
export async function fetchCalculation(
  expression: string
): Promise<{ result?: number; error?: string }> {
  const apiExpression = convertExpressionForApi(expression);

  const response = await fetch("/api/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ expression: apiExpression }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { error: data.error || "Calculation failed" };
  }

  return { result: data.result };
}

/**
 * ログアウトAPIにリクエストを送信する。
 */
export async function submitLogout(
  fetchFn: typeof fetch = fetch
): Promise<{ success: boolean; error?: string }> {
  const response = await fetchFn("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json();
    return { success: false, error: data.error || "Logout failed" };
  }

  return { success: true };
}

/**
 * 電卓メインコンポーネント。
 * Display、Buttonを組み合わせ、計算APIへの送信と結果表示を行う。
 * ログアウトボタンも含む。
 */
export default function Calculator() {
  const router = useRouter();
  // 入力中の数式
  const [expression, setExpression] = useState("");
  // 計算結果（表示用文字列）
  const [result, setResult] = useState("");
  // エラーメッセージ
  const [error, setError] = useState("");
  // API通信中フラグ
  const [loading, setLoading] = useState(false);
  // 計算履歴（クライアントstateのみ、リロードでクリア）
  const [history, setHistory] = useState<HistoryItem[]>([]);
  // ログアウト処理中フラグ
  const [loggingOut, setLoggingOut] = useState(false);

  /**
   * ボタン押下ハンドラ。
   * ラベルに応じて数式の組み立て、計算実行、クリアを行う。
   */
  const handleButtonClick = async (label: string) => {
    // エラー表示をクリア
    setError("");

    // Cボタン: 全クリア
    if (label === "C") {
      setExpression("");
      setResult("");
      return;
    }

    // CEボタン: 直前の1文字を削除
    if (label === "CE") {
      setExpression((prev) => prev.slice(0, -1));
      return;
    }

    // =ボタン: 計算APIに送信
    if (label === "=") {
      if (expression === "") return;

      setLoading(true);
      try {
        const calcResult = await fetchCalculation(expression);
        if (calcResult.error) {
          setError(calcResult.error);
        } else {
          const resultStr = String(calcResult.result);
          setResult(resultStr);
          // 計算成功時に履歴に追加（新しいものが先頭）
          setHistory((prev) => [
            { expression, result: resultStr },
            ...prev,
          ]);
        }
      } catch {
        setError("Communication error");
      } finally {
        setLoading(false);
      }
      return;
    }

    // 数字・演算子・小数点: 数式に追記
    setExpression((prev) => appendToExpression(prev, label));
  };

  /**
   * ログアウトボタン押下ハンドラ。
   * ログアウトAPIを呼び出し、成功時はログインページへ遷移する。
   */
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const logoutResult = await submitLogout();
      if (logoutResult.success) {
        router.push("/login");
      } else {
        setError(logoutResult.error || "Logout failed");
      }
    } catch {
      setError("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className={styles.calculator}>
      {/* ヘッダー: タイトルとログアウトボタン */}
      <div className={styles.header}>
        <h1 className={styles.title}>Calculator</h1>
        <button
          className={styles.logoutButton}
          onClick={handleLogout}
          disabled={loggingOut}
          type="button"
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      {/* ディスプレイ: 数式と結果を表示 */}
      <Display expression={expression} result={result} />

      {/* エラーメッセージ表示 */}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {/* ローディング表示 */}
      {loading && (
        <div className={styles.loading} aria-live="polite">
          Calculating...
        </div>
      )}

      {/* ボタングリッド */}
      <div className={styles.buttons}>
        {BUTTON_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {row.map((label) => (
              <Button key={label} label={label} onClick={handleButtonClick} />
            ))}
          </div>
        ))}
      </div>

      {/* 計算履歴 */}
      <History items={history} />
    </div>
  );
}
