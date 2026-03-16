"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./LoginForm.module.css";

/**
 * ログインフォームのバリデーションを実行する。
 * ユーザー名またはパスワードが空の場合にエラーメッセージを返す。
 */
export function validateLoginForm(username: string, password: string): string | null {
  if (!username.trim()) {
    return "Username is required";
  }
  if (!password) {
    return "Password is required";
  }
  return null;
}

/**
 * ログインAPIにリクエストを送信し、結果を返す。
 */
export async function submitLogin(
  username: string,
  password: string,
  fetchFn: typeof fetch = fetch
): Promise<{ success: boolean; error?: string }> {
  const response = await fetchFn("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.error || "Login failed" };
  }

  return { success: true };
}

/**
 * ログインフォームコンポーネント。
 * ユーザー名とパスワードを入力し、認証を行う。
 * ログイン成功時は電卓ページへ遷移する。
 */
export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // フォーム送信処理
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // クライアントサイドバリデーション
    const validationError = validateLoginForm(username, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // ログインAPIの呼び出し
      const result = await submitLogin(username, password);

      if (result.success) {
        // ログイン成功時は電卓ページへフルページナビゲーション
        // router.pushではRSC fetchでcookieが送信されないため
        window.location.href = "/calculator";
      } else {
        setError(result.error || "Login failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Log In</h1>

        {/* エラーメッセージの表示 */}
        {error && <p className={styles.error}>{error}</p>}

        {/* ユーザー名入力フィールド */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className={styles.input}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            autoComplete="username"
            required
          />
        </div>

        {/* パスワード入力フィールド */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        {/* ログインボタン */}
        <button
          className={styles.button}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Log In"}
        </button>

        {/* サインアップページへのリンク */}
        <p className={styles.link}>
          Don&apos;t have an account?{" "}
          <Link href="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
