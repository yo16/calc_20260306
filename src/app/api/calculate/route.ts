import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { calculate, CalculateResult } from "@/lib/calculator/engine";

/**
 * 計算APIのハンドラーロジック（テスト容易性のため分離）
 * cookieからJWTを検証し、認証済みユーザーの数式を計算エンジンで処理する
 */
export function handleCalculate(
  body: Record<string, unknown>,
  token: string | undefined,
  tokenVerifier: (token: string) => unknown = verifyToken
): {
  status: number;
  body: Record<string, unknown>;
} {
  // JWT認証チェック
  if (!token) {
    return {
      status: 401,
      body: { error: "Unauthorized" },
    };
  }

  const payload = tokenVerifier(token);
  if (!payload) {
    return {
      status: 401,
      body: { error: "Unauthorized" },
    };
  }

  // 数式の存在チェック
  const { expression } = body;
  if (!expression || typeof expression !== "string" || expression.trim() === "") {
    return {
      status: 400,
      body: { error: "Empty expression" },
    };
  }

  // 計算エンジンで数式を処理
  const result: CalculateResult = calculate(expression);

  // エラー判定: errorプロパティの有無で成功/失敗を判別
  if ("error" in result) {
    return {
      status: 400,
      body: { error: result.error },
    };
  }

  // 正常系: 数式と結果を返す
  return {
    status: 200,
    body: { expression: result.expression, result: result.result },
  };
}

/**
 * POST /api/calculate
 * 認証済みユーザーの数式を計算して結果を返す
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    const body = await request.json();
    const result = handleCalculate(body, token);

    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
