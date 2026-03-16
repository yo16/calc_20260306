import { UserRepository } from "@/lib/repositories/types";
import { User, CreateUserInput } from "@/types";
import { handleLogin } from "@/app/api/auth/login/route";

/**
 * Mock UserRepository for testing login API logic.
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

  /** Add a pre-existing user for login tests. */
  addUser(user: User): void {
    this.users.push(user);
  }

  /** Reset all stored users (for test isolation). */
  reset(): void {
    this.users = [];
  }
}

/**
 * Fake password verifier that compares against "hashed_<password>" pattern.
 */
async function fakeVerifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return hash === `hashed_${password}`;
}

/**
 * Fake token generator that returns a predictable token.
 */
function fakeGenerateToken(payload: {
  userId: string;
  email: string;
}): string {
  return `fake-jwt-${payload.userId}`;
}

const testUser: User = {
  id: "user-1",
  username: "testuser",
  passwordHash: "hashed_password123",
  createdAt: "2026-03-15T00:00:00.000Z",
};

describe("POST /api/auth/login", () => {
  let mockRepo: MockUserRepository;

  beforeEach(() => {
    mockRepo = new MockUserRepository();
    mockRepo.addUser({ ...testUser });
  });

  describe("Normal cases", () => {
    it("should return 200 with valid credentials and set cookie", async () => {
      const result = await handleLogin(
        { username: "testuser", password: "password123" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      expect(result.status).toBe(200);
      expect(result.body.message).toBe("Login successful");

      // User info should be present without passwordHash
      const user = result.body.user as {
        id: string;
        username: string;
        createdAt: string;
      };
      expect(user.id).toBe("user-1");
      expect(user.username).toBe("testuser");
      expect(user.createdAt).toBeDefined();
      expect(user).not.toHaveProperty("passwordHash");

      // Cookie should be set with JWT
      expect(result.cookie).toBeDefined();
      expect(result.cookie!.name).toBe("token");
      expect(result.cookie!.value).toBe("fake-jwt-user-1");
      expect(result.cookie!.options.httpOnly).toBe(true);
      expect(result.cookie!.options.secure).toBe(process.env.NODE_ENV === "production");
      expect(result.cookie!.options.sameSite).toBe("strict");
    });
  });

  describe("Validation errors (400)", () => {
    it("should return 400 when username is missing", async () => {
      const result = await handleLogin(
        { password: "password123" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      expect(result.status).toBe(400);
      expect(result.body.error).toBe("Username is required");
    });

    it("should return 400 when username is empty string", async () => {
      const result = await handleLogin(
        { username: "", password: "password123" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      expect(result.status).toBe(400);
      expect(result.body.error).toBe("Username is required");
    });

    it("should return 400 when username is whitespace only", async () => {
      const result = await handleLogin(
        { username: "   ", password: "password123" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      expect(result.status).toBe(400);
      expect(result.body.error).toBe("Username is required");
    });

    it("should return 400 when password is missing", async () => {
      const result = await handleLogin(
        { username: "testuser" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      expect(result.status).toBe(400);
      expect(result.body.error).toBe("Password is required");
    });

    it("should return 400 when password is empty string", async () => {
      const result = await handleLogin(
        { username: "testuser", password: "" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      expect(result.status).toBe(400);
      expect(result.body.error).toBe("Password is required");
    });
  });

  describe("Authentication errors (401)", () => {
    it("should return 401 when user does not exist", async () => {
      const result = await handleLogin(
        { username: "nonexistent", password: "password123" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      expect(result.status).toBe(401);
      expect(result.body.error).toBe("Invalid credentials");
    });

    it("should return 401 when password is incorrect", async () => {
      const result = await handleLogin(
        { username: "testuser", password: "wrongpassword" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      expect(result.status).toBe(401);
      expect(result.body.error).toBe("Invalid credentials");
    });

    it("should return same error for nonexistent user and wrong password", async () => {
      const nonexistentResult = await handleLogin(
        { username: "nonexistent", password: "password123" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      const wrongPasswordResult = await handleLogin(
        { username: "testuser", password: "wrongpassword" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      // Both should return the same generic error message
      // to prevent user enumeration
      expect(nonexistentResult.body.error).toBe(wrongPasswordResult.body.error);
      expect(nonexistentResult.body.error).toBe("Invalid credentials");
    });
  });

  describe("Response format", () => {
    it("should not include passwordHash in the response user object", async () => {
      const result = await handleLogin(
        { username: "testuser", password: "password123" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      expect(result.status).toBe(200);
      const user = result.body.user as Record<string, unknown>;
      expect(user).not.toHaveProperty("passwordHash");
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("username");
      expect(user).toHaveProperty("createdAt");
    });

    it("should not set cookie on failed login", async () => {
      const result = await handleLogin(
        { username: "testuser", password: "wrongpassword" },
        mockRepo,
        fakeVerifyPassword,
        fakeGenerateToken
      );

      expect(result.status).toBe(401);
      expect(result.cookie).toBeUndefined();
    });
  });
});
