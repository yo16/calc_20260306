"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./SignupForm.module.css";

/**
 * サインアップフォームのバリデーションを実行する。
 * パスワードが8文字未満の場合にエラーメッセージを返す。
 */
export function validateSignupForm(username: string, password: string): string | null {
  if (!username.trim()) {
    return "Username is required";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  return null;
}

/**
 * サインアップAPIにリクエストを送信し、結果を返す。
 */
export async function submitSignup(
  username: string,
  password: string,
  fetchFn: typeof fetch = fetch
): Promise<{ success: boolean; error?: string }> {
  const response = await fetchFn("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.error || "Registration failed" };
  }

  return { success: true };
}

/**
 * サインアップフォームコンポーネント。
 * ユーザー名とパスワードを入力し、新規アカウントを作成する。
 * 登録成功時はログインページへ遷移する。
 */
export default function SignupForm() {
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
    const validationError = validateSignupForm(username, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // サインアップAPIの呼び出し
      const result = await submitSignup(username, password);

      if (result.success) {
        // 登録成功時はログインページへ遷移
        router.push("/login");
      } else {
        setError(result.error || "Registration failed");
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
        <h1 className={styles.title}>Sign Up</h1>

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
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />
        </div>

        {/* 登録ボタン */}
        <button
          className={styles.button}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>

        {/* ログインページへのリンク */}
        <p className={styles.link}>
          Already have an account?{" "}
          <Link href="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
