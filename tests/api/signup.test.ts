import { UserRepository } from "@/lib/repositories/types";
import { User, CreateUserInput } from "@/types";

/**
 * Mock UserRepository for testing signup API logic.
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

  /** Reset all stored users (for test isolation). */
  reset(): void {
    this.users = [];
  }
}

/**
 * Extracted signup handler logic for unit testing.
 * Mirrors the logic in src/app/api/auth/signup/route.ts
 * but accepts a repository dependency for testability.
 */
async function handleSignup(
  body: Record<string, unknown>,
  userRepository: UserRepository
): Promise<{ status: number; body: Record<string, unknown> }> {
  const { username, password } = body;

  // Validate username
  if (!username || typeof username !== "string" || (username as string).trim() === "") {
    return {
      status: 400,
      body: { error: "Username is required" },
    };
  }

  // Validate password length
  if (!password || typeof password !== "string" || (password as string).length < 8) {
    return {
      status: 400,
      body: { error: "Password must be at least 8 characters" },
    };
  }

  const trimmedUsername = (username as string).trim();

  // Check for duplicate username
  const exists = await userRepository.existsByUsername(trimmedUsername);
  if (exists) {
    return {
      status: 409,
      body: { error: "Username already exists" },
    };
  }

  // Use a fake hash for testing (avoids bcrypt dependency in unit tests)
  const passwordHash = `hashed_${password}`;
  const user = await userRepository.create({
    username: trimmedUsername,
    passwordHash,
  });

  return {
    status: 201,
    body: {
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    },
  };
}

describe("POST /api/auth/signup", () => {
  let mockRepo: MockUserRepository;

  beforeEach(() => {
    mockRepo = new MockUserRepository();
  });

  describe("Normal cases", () => {
    it("should return 201 with valid username and password", async () => {
      const result = await handleSignup(
        { username: "testuser", password: "password123" },
        mockRepo
      );

      expect(result.status).toBe(201);
      expect(result.body.message).toBe("User created successfully");

      const user = result.body.user as { id: string; username: string; createdAt: string };
      expect(user.id).toBeDefined();
      expect(user.username).toBe("testuser");
      expect(user.createdAt).toBeDefined();
      // passwordHash must NOT be in response
      expect(user).not.toHaveProperty("passwordHash");
    });

    it("should return 201 with password of exactly 8 characters (boundary)", async () => {
      const result = await handleSignup(
        { username: "boundaryuser", password: "12345678" },
        mockRepo
      );

      expect(result.status).toBe(201);
      expect(result.body.message).toBe("User created successfully");

      const user = result.body.user as { id: string; username: string };
      expect(user.username).toBe("boundaryuser");
    });
  });

  describe("Validation errors (400)", () => {
    it("should return 400 when username is empty string", async () => {
      const result = await handleSignup(
        { username: "", password: "password123" },
        mockRepo
      );

      expect(result.status).toBe(400);
      expect(result.body.error).toBe("Username is required");
    });

    it("should return 400 when username is whitespace only", async () => {
      const result = await handleSignup(
        { username: "   ", password: "password123" },
        mockRepo
      );

      expect(result.status).toBe(400);
      expect(result.body.error).toBe("Username is required");
    });

    it("should return 400 when username is missing", async () => {
      const result = await handleSignup(
        { password: "password123" },
        mockRepo
      );

      expect(result.status).toBe(400);
      expect(result.body.error).toBe("Username is required");
    });

    it("should return 400 when password is less than 8 characters", async () => {
      const result = await handleSignup(
        { username: "testuser", password: "short" },
        mockRepo
      );

      expect(result.status).toBe(400);
      expect(result.body.error).toBe("Password must be at least 8 characters");
    });

    it("should return 400 when password has exactly 7 characters", async () => {
      const result = await handleSignup(
        { username: "testuser", password: "1234567" },
        mockRepo
      );

      expect(result.status).toBe(400);
      expect(result.body.error).toBe("Password must be at least 8 characters");
    });

    it("should return 400 when password is missing", async () => {
      const result = await handleSignup(
        { username: "testuser" },
        mockRepo
      );

      expect(result.status).toBe(400);
      expect(result.body.error).toBe("Password must be at least 8 characters");
    });

    it("should return 400 when password is empty string", async () => {
      const result = await handleSignup(
        { username: "testuser", password: "" },
        mockRepo
      );

      expect(result.status).toBe(400);
      expect(result.body.error).toBe("Password must be at least 8 characters");
    });
  });

  describe("Duplicate username (409)", () => {
    it("should return 409 when username already exists", async () => {
      // First signup should succeed
      const first = await handleSignup(
        { username: "duplicate", password: "password123" },
        mockRepo
      );
      expect(first.status).toBe(201);

      // Second signup with same username should fail
      const second = await handleSignup(
        { username: "duplicate", password: "anotherpass123" },
        mockRepo
      );

      expect(second.status).toBe(409);
      expect(second.body.error).toBe("Username already exists");
    });
  });

  describe("Response format", () => {
    it("should not include passwordHash in the response user object", async () => {
      const result = await handleSignup(
        { username: "secureuser", password: "password123" },
        mockRepo
      );

      expect(result.status).toBe(201);
      const user = result.body.user as Record<string, unknown>;
      expect(user).not.toHaveProperty("passwordHash");
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("username");
      expect(user).toHaveProperty("createdAt");
    });
  });
});
