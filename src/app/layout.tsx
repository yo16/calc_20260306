import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import styles from "./layout.module.css";

/* フォント設定 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* メタデータ定義 */
export const metadata: Metadata = {
  title: "CalcApp - Web Calculator",
  description: "A secure web calculator application with user authentication",
};

/**
 * ルートレイアウトコンポーネント。
 * 全ページ共通のヘッダー・メインコンテンツ・フッターを提供する。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className={styles.wrapper}>
          {/* ヘッダー: アプリ名を表示 */}
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <Link href="/" className={styles.appTitle}>
                CalcApp
              </Link>
            </div>
          </header>

          {/* メインコンテンツエリア */}
          <main className={styles.main}>
            {children}
          </main>

          {/* フッター: コピーライト表示 */}
          <footer className={styles.footer}>
            <div className={styles.footerContent}>
              <p className={styles.footerText}>
                &copy; 2026 CalcApp. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
