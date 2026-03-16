import { redirect } from "next/navigation";

/**
 * ルートページ。
 * ログインページへリダイレクトする。
 * 認証済みユーザーの場合はミドルウェアで電卓ページへ振り分けられる。
 */
export default function Home() {
  redirect("/login");
}
