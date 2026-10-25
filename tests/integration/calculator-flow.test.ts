import { UserRepository } from "@/lib/repositories/types";
import { User, CreateUserInput } from "@/types";
import { handleLogin } from "@/app/api/auth/login/route";
import { handleCalculate } from "@/app/api/calculate/route";

/**
 * テスト用モックリポジトリ
 * インメモリでユーザーデータを管理する
 */
class MockUserRepository implements UserRepository {
  private users: User[] = [];

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find((u) => u.username === username) ?? null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const user: User = {
      id: `mock-id-${this.users.length + 1}`,
      username: input.username,
      passwordHash: input.passwordHash,
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    return user;
  }

  async existsByUsername(username: string): Promise<boolean> {
    return this.users.some((u) => u.username === username);
  }
}

/**
 * フェイクパスワード検証
 */
async function fakeVerifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return hash === `hashed_${password}`;
}

/**
 * フェイクトークン生成
 */
function fakeGenerateToken(payload: {
  userId: string;
  email: string;
}): string {
  return `fake-jwt-${payload.userId}`;
}

/**
 * フェイクトークン検証: "fake-jwt-" で始まるトークンのみ有効
 */
function fakeVerifyToken(token: string): unknown {
  if (token.startsWith("fake-jwt-")) {
    const userId = token.replace("fake-jwt-", "");
    return { userId, email: "calcuser", iat: 0, exp: 9999999999 };
  }
  return null;
}

describe("電卓フロー統合テスト", () => {
  let mockRepo: MockUserRepository;
  let authToken: string;

  // 各テストの前にユーザーを作成しログインしてトークンを取得する
  beforeEach(async () => {
    mockRepo = new MockUserRepository();

    await mockRepo.create({
      username: "calcuser",
      passwordHash: "hashed_calcpassword1",
    });

    const loginResult = await handleLogin(
      { username: "calcuser", password: "calcpassword1" },
      mockRepo,
      fakeVerifyPassword,
      fakeGenerateToken
    );

    authToken = loginResult.cookie!.value;
  });

  // ----- 正常系: ログイン→計算API呼び出し→結果検証 -----
  describe("正常系: ログイン後に計算APIを呼び出して結果を取得する", () => {
    it("足し算の結果が正しいこと", () => {
      const result = handleCalculate(
        { expression: "3 + 5" },
        authToken,
        fakeVerifyToken
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ expression: "3 + 5", result: 8 });
    });

    it("引き算の結果が正しいこと", () => {
      const result = handleCalculate(
        { expression: "100 - 37" },
        authToken,
        fakeVerifyToken
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ expression: "100 - 37", result: 63 });
    });

    it("掛け算の結果が正しいこと", () => {
      const result = handleCalculate(
        { expression: "7 * 8" },
        authToken,
        fakeVerifyToken
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ expression: "7 * 8", result: 56 });
    });

    it("割り算の結果が正しいこと", () => {
      const result = handleCalculate(
        { expression: "15 / 4" },
        authToken,
        fakeVerifyToken
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ expression: "15 / 4", result: 3.75 });
    });

    it("演算子の優先順位が正しく処理されること", () => {
      const result = handleCalculate(
        { expression: "2 + 3 * 4" },
        authToken,
        fakeVerifyToken
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ expression: "2 + 3 * 4", result: 14 });
    });

    it("小数を含む計算が正しいこと", () => {
      const result = handleCalculate(
        { expression: "1.5 * 2.5" },
        authToken,
        fakeVerifyToken
      );

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ expression: "1.5 * 2.5", result: 3.75 });
    });
  });

  // ----- 正常系: 複数の計算を連続実行 -----
  describe("正常系: 複数の計算を連続で実行できること", () => {
    it("5つの計算を連続で正しく実行できること", () => {
      const expressions = [
        { expression: "1 + 1", expected: 2 },
        { expression: "10 * 5", expected: 50 },
        { expression: "100 / 4", expected: 25 },
        { expression: "99 - 33", expected: 66 },
        { expression: "2 + 3 * 4 - 1", expected: 13 },
      ];

      // 全ての計算が成功すること
      for (const { expression, expected } of expressions) {
        const result = handleCalculate(
          { expression },
          authToken,
          fakeVerifyToken
        );

        expect(result.status).toBe(200);
        expect(result.body).toEqual({ expression, result: expected });
      }
    });
  });

  // ----- 異常系: 不正な数式のエラーハンドリング -----
  describe("異常系: 不正な数式が適切にエラーハンドリングされること", () => {
    it("空の数式で400エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "" },
        authToken,
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toEqual({ error: "Empty expression" });
    });

    it("expressionプロパティがない場合400エラーが返ること", () => {
      const result = handleCalculate(
        {},
        authToken,
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toEqual({ error: "Empty expression" });
    });

    it("不正な文字を含む数式で400エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "eval(alert)" },
        authToken,
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("error");
    });

    it("ゼロ除算で400エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "10 / 0" },
        authToken,
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toEqual({ error: "Division by zero" });
    });

    it("不完全な数式で400エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "5 +" },
        authToken,
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("error");
    });

    it("演算子のみの数式で400エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "+" },
        authToken,
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("error");
    });

    it("最大文字数を超える数式で400エラーが返ること", () => {
      // 101文字の数式を生成
      const longExpression = "1+" + "1+".repeat(49) + "1";
      const result = handleCalculate(
        { expression: longExpression },
        authToken,
        fakeVerifyToken
      );

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("error");
    });
  });

  // ----- 異常系: 未認証状態での計算API呼び出し拒否 -----
  describe("異常系: 未認証状態で計算APIが拒否されること", () => {
    it("トークンなしで401エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "1 + 1" },
        undefined,
        fakeVerifyToken
      );

      expect(result.status).toBe(401);
      expect(result.body).toEqual({ error: "Unauthorized" });
    });

    it("無効なトークンで401エラーが返ること", () => {
      const result = handleCalculate(
        { expression: "1 + 1" },
        "invalid-token-value",
        fakeVerifyToken
      );

      expect(result.status).toBe(401);
      expect(result.body).toEqual({ error: "Unauthorized" });
    });

    it("空文字トークンで401エラーが返ること", () => {
      // ログアウト後のcookie値（空文字）をシミュレート
      const result = handleCalculate(
        { expression: "1 + 1" },
        "",
        fakeVerifyToken
      );

      expect(result.status).toBe(401);
      expect(result.body).toEqual({ error: "Unauthorized" });
    });
  });

  // ----- 認証→計算→エラー→再計算のフロー -----
  describe("正常系: エラー後に再計算が可能であること", () => {
    it("不正な数式のエラー後も正常な計算が実行できること", () => {
      // 不正な数式を送信
      const errorResult = handleCalculate(
        { expression: "abc" },
        authToken,
        fakeVerifyToken
      );
      expect(errorResult.status).toBe(400);

      // 正常な数式を送信（エラー後も問題なく動作すること）
      const successResult = handleCalculate(
        { expression: "5 + 3" },
        authToken,
        fakeVerifyToken
      );
      expect(successResult.status).toBe(200);
      expect(successResult.body).toEqual({ expression: "5 + 3", result: 8 });
    });

    it("ゼロ除算エラー後も正常な計算が実行できること", () => {
      // ゼロ除算
      const errorResult = handleCalculate(
        { expression: "1 / 0" },
        authToken,
        fakeVerifyToken
      );
      expect(errorResult.status).toBe(400);

      // 正常な除算
      const successResult = handleCalculate(
        { expression: "10 / 2" },
        authToken,
        fakeVerifyToken
      );
      expect(successResult.status).toBe(200);
      expect(successResult.body).toEqual({ expression: "10 / 2", result: 5 });
    });
  });
});
