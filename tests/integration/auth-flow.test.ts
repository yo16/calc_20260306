import { UserRepository } from "@/lib/repositories/types";
import { User, CreateUserInput } from "@/types";
import { handleLogin } from "@/app/api/auth/login/route";
import { handleLogout } from "@/app/api/auth/logout/route";
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
    const exists = this.users.some((u) => u.username === input.username);
    if (exists) {
      throw new Error(`User with username "${input.username}" already exists`);
    }

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

  /** テスト用: ユーザーデータをリセット */
  reset(): void {
    this.users = [];
  }
}

/**
 * フェイクパスワードハッシュ: "hashed_<平文>" のパターンで照合
 */
async function fakeVerifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return hash === `hashed_${password}`;
}

/**
 * フェイクトークン生成: "fake-jwt-<userId>" を返す
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
    return { userId, email: "testuser", iat: 0, exp: 9999999999 };
  }
  return null;
}

/**
 * 期限切れトークン検証: 全てのトークンを無効と判定する
 */
function expiredTokenVerifier(): unknown {
  return null;
}

describe("認証フロー統合テスト", () => {
  let mockRepo: MockUserRepository;

  beforeEach(() => {
    mockRepo = new MockUserRepository();
  });

  // ----- 正常系: サインアップ→ログイン→認証済みAPI呼び出し→ログアウト -----
  describe("正常系: サインアップ→ログイン→認証済みAPI呼び出し→ログアウトの一連フロー", () => {
    it("全フローが正常に動作すること", async () => {
      // ステップ1: サインアップ（ユーザー作成）
      const newUser = await mockRepo.create({
        username: "integrationuser",
        passwordHash: "hashed_securepassword123",
      });
      expect(newUser.username).toBe("integrationuser");
      expect(newUser.id).toBeDefined();

      // ステップ2: ログイン
      const loginResult = await handleLogin(
        { username: "integrationuser", password: "securepassword123" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );
      expect(loginResult.status).toBe(200);
      expect(loginResult.body.message).toBe("Login successful");
      expect(loginResult.cookie).toBeDefined();

      const token = loginResult.cookie!.value;
      expect(token).toBeTruthy();

      // ステップ3: 認証済みで計算APIを呼び出し
      const calcResult = handleCalculate(
        { expression: "10 + 20" },
        token,
        fakeVerifyToken
      );
      expect(calcResult.status).toBe(200);
      expect(calcResult.body).toEqual({ expression: "10 + 20", result: 30 });

      // ステップ4: ログアウト
      const logoutResult = handleLogout();
      expect(logoutResult.status).toBe(200);
      expect(logoutResult.body.message).toBe("Logged out successfully");
      expect(logoutResult.cookie.value).toBe("");
      expect(logoutResult.cookie.options.maxAge).toBe(0);
    });
  });

  // ----- 正常系: 複数ユーザーが独立して認証フローを実行 -----
  describe("正常系: 複数ユーザーが独立して認証できること", () => {
    it("異なるユーザーがそれぞれログインしてトークンを取得できる", async () => {
      // ユーザー1を作成
      await mockRepo.create({
        username: "user1",
        passwordHash: "hashed_password1abc",
      });

      // ユーザー2を作成
      await mockRepo.create({
        username: "user2",
        passwordHash: "hashed_password2abc",
      });

      // ユーザー1でログイン
      const login1 = await handleLogin(
        { username: "user1", password: "password1abc" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );
      expect(login1.status).toBe(200);

      // ユーザー2でログイン
      const login2 = await handleLogin(
        { username: "user2", password: "password2abc" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );
      expect(login2.status).toBe(200);

      // それぞれのトークンが異なること
      expect(login1.cookie!.value).not.toBe(login2.cookie!.value);
    });
  });

  // ----- 異常系: 未認証状態でのAPI呼び出し拒否 -----
  describe("異常系: 未認証状態でのAPI呼び出しが拒否されること", () => {
    it("トークンなしで計算APIを呼び出すと401が返ること", () => {
      const result = handleCalculate(
        { expression: "1 + 1" },
        undefined,
        fakeVerifyToken
      );

      expect(result.status).toBe(401);
      expect(result.body).toEqual({ error: "Unauthorized" });
    });

    it("不正なトークンで計算APIを呼び出すと401が返ること", () => {
      const result = handleCalculate(
        { expression: "1 + 1" },
        "completely-invalid-token",
        fakeVerifyToken
      );

      expect(result.status).toBe(401);
      expect(result.body).toEqual({ error: "Unauthorized" });
    });
  });

  // ----- 異常系: セッション期限切れ後のAPI拒否 -----
  describe("異常系: セッション期限切れ後にAPIアクセスが拒否されること", () => {
    it("期限切れトークンで計算APIを呼び出すと401が返ること", async () => {
      // まずログインしてトークンを取得
      await mockRepo.create({
        username: "expireduser",
        passwordHash: "hashed_testpassword1",
      });

      const loginResult = await handleLogin(
        { username: "expireduser", password: "testpassword1" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );
      expect(loginResult.status).toBe(200);

      const token = loginResult.cookie!.value;

      // 期限切れトークン検証器を使って計算APIを呼び出す
      const calcResult = handleCalculate(
        { expression: "5 + 5" },
        token,
        expiredTokenVerifier
      );

      expect(calcResult.status).toBe(401);
      expect(calcResult.body).toEqual({ error: "Unauthorized" });
    });
  });

  // ----- 異常系: ログアウト後のAPI呼び出し拒否 -----
  describe("異常系: ログアウト後にAPIアクセスが拒否されること", () => {
    it("ログアウト後に空のトークンで計算APIを呼び出すと401が返ること", async () => {
      // ログインしてトークン取得
      await mockRepo.create({
        username: "logoutuser",
        passwordHash: "hashed_logoutpass1",
      });

      const loginResult = await handleLogin(
        { username: "logoutuser", password: "logoutpass1" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );
      expect(loginResult.status).toBe(200);

      // ログアウト
      const logoutResult = handleLogout();
      expect(logoutResult.status).toBe(200);

      // ログアウト後のcookie値（空文字）を使ってAPIを呼び出す
      const logoutCookieValue = logoutResult.cookie.value;
      expect(logoutCookieValue).toBe("");

      // 空トークンでの計算API呼び出しは401となること
      const calcResult = handleCalculate(
        { expression: "1 + 1" },
        logoutCookieValue || undefined,
        fakeVerifyToken
      );

      expect(calcResult.status).toBe(401);
      expect(calcResult.body).toEqual({ error: "Unauthorized" });
    });
  });

  // ----- 異常系: 存在しないユーザーでのログイン失敗 -----
  describe("異常系: サインアップしていないユーザーでログインが失敗すること", () => {
    it("未登録ユーザーでログインすると401が返ること", async () => {
      const result = await handleLogin(
        { username: "nonexistent", password: "somepassword1" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      expect(result.status).toBe(401);
      expect(result.body.error).toBe("Invalid credentials");
    });
  });

  // ----- 異常系: 重複ユーザー名でのサインアップ失敗 -----
  describe("異常系: 重複ユーザー名でサインアップが失敗すること", () => {
    it("既に存在するユーザー名で作成するとエラーが発生すること", async () => {
      await mockRepo.create({
        username: "duplicateuser",
        passwordHash: "hashed_password123",
      });

      await expect(
        mockRepo.create({
          username: "duplicateuser",
          passwordHash: "hashed_otherpassword",
        })
      ).rejects.toThrow('User with username "duplicateuser" already exists');
    });
  });

  // ----- Cookie設定の検証 -----
  describe("セキュリティ: Cookieの設定が適切であること", () => {
    it("ログイン時のCookieがhttpOnly, secure, sameSite=strictであること", async () => {
      await mockRepo.create({
        username: "cookieuser",
        passwordHash: "hashed_cookiepass1",
      });

      const loginResult = await handleLogin(
        { username: "cookieuser", password: "cookiepass1" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      expect(loginResult.cookie).toBeDefined();
      expect(loginResult.cookie!.options.httpOnly).toBe(true);
      expect(loginResult.cookie!.options.secure).toBe(process.env.NODE_ENV === "production");
      expect(loginResult.cookie!.options.sameSite).toBe("strict");
      expect(loginResult.cookie!.options.path).toBe("/");
    });

    it("ログアウト時のCookieがmaxAge=0で削除されること", () => {
      const logoutResult = handleLogout();

      expect(logoutResult.cookie.value).toBe("");
      expect(logoutResult.cookie.options.maxAge).toBe(0);
      expect(logoutResult.cookie.options.httpOnly).toBe(true);
      expect(logoutResult.cookie.options.secure).toBe(process.env.NODE_ENV === "production");
      expect(logoutResult.cookie.options.sameSite).toBe("strict");
    });
  });
});
