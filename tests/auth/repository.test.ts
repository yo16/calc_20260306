import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { FileUserRepository } from "@/lib/repositories/file-user-repository";
import { CreateUserInput } from "@/types";

describe("FileUserRepository", () => {
  let tmpDir: string;
  let repo: FileUserRepository;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "repo-test-"));
    repo = new FileUserRepository(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("create", () => {
    it("should create a user and persist to JSON file", async () => {
      const input: CreateUserInput = {
        username: "testuser",
        passwordHash: "$2b$10$hashedpassword",
      };

      const user = await repo.create(input);

      expect(user.id).toBeDefined();
      expect(user.username).toBe("testuser");
      expect(user.passwordHash).toBe("$2b$10$hashedpassword");
      expect(user.createdAt).toBeDefined();

      // Verify file was written
      const filePath = path.join(tmpDir, "users.json");
      expect(fs.existsSync(filePath)).toBe(true);

      const fileContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      expect(fileContent).toHaveLength(1);
      expect(fileContent[0].username).toBe("testuser");
    });

    it("should throw an error when creating a user with a duplicate username", async () => {
      const input: CreateUserInput = {
        username: "duplicate",
        passwordHash: "$2b$10$hash1",
      };

      await repo.create(input);

      const duplicateInput: CreateUserInput = {
        username: "duplicate",
        passwordHash: "$2b$10$hash2",
      };

      await expect(repo.create(duplicateInput)).rejects.toThrow(
        'User with username "duplicate" already exists'
      );
    });
  });

  describe("findByUsername", () => {
    it("should return the user when found", async () => {
      const input: CreateUserInput = {
        username: "findme",
        passwordHash: "$2b$10$somehash",
      };
      const created = await repo.create(input);

      const found = await repo.findByUsername("findme");

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.username).toBe("findme");
      expect(found!.passwordHash).toBe("$2b$10$somehash");
    });

    it("should return null when user does not exist", async () => {
      const found = await repo.findByUsername("nonexistent");

      expect(found).toBeNull();
    });
  });

  describe("existsByUsername", () => {
    it("should return true when user exists", async () => {
      await repo.create({
        username: "existing",
        passwordHash: "$2b$10$hash",
      });

      const exists = await repo.existsByUsername("existing");

      expect(exists).toBe(true);
    });

    it("should return false when user does not exist", async () => {
      const exists = await repo.existsByUsername("nonexistent");

      expect(exists).toBe(false);
    });
  });

  describe("file handling", () => {
    it("should handle missing data directory by creating it", async () => {
      const nestedDir = path.join(tmpDir, "nested", "dir");
      const nestedRepo = new FileUserRepository(nestedDir);

      const user = await nestedRepo.create({
        username: "nesteduser",
        passwordHash: "$2b$10$hash",
      });

      expect(user.username).toBe("nesteduser");
      expect(fs.existsSync(path.join(nestedDir, "users.json"))).toBe(true);
    });

    it("should return empty results when users.json does not exist", async () => {
      const found = await repo.findByUsername("anyone");
      expect(found).toBeNull();

      const exists = await repo.existsByUsername("anyone");
      expect(exists).toBe(false);
    });
  });
});
