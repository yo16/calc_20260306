import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";

/**
 * ルートページ。
 * 認証済みユーザーは電卓ページへ、未認証ユーザーはログインページへリダイレクトする。
 */
export default async function Home() {
  // cookieからトークンを取得して認証状態を判定
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      // 認証済み: 電卓ページへリダイレクト
      redirect("/calculator");
    }
  }

  // 未認証: ログインページへリダイレクト
  redirect("/login");
}
