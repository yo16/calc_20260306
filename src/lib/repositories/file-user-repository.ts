import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { User, CreateUserInput } from "@/types";
import { UserRepository } from "./types";

/**
 * File-based implementation of UserRepository.
 * Stores user data as JSON in a local file.
 */
export class FileUserRepository implements UserRepository {
  private readonly filePath: string;

  constructor(dataDir?: string) {
    const dir = dataDir ?? process.env.DATA_DIR ?? "./data";
    this.filePath = path.resolve(dir, "users.json");
  }

  async findByUsername(username: string): Promise<User | null> {
    const users = await this.readUsers();
    return users.find((u) => u.username === username) ?? null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const users = await this.readUsers();

    const exists = users.some((u) => u.username === input.username);
    if (exists) {
      throw new Error(
        `User with username "${input.username}" already exists`
      );
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username: input.username,
      passwordHash: input.passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await this.writeUsers(users);

    return newUser;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const users = await this.readUsers();
    return users.some((u) => u.username === username);
  }

  private async readUsers(): Promise<User[]> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(data) as User[];
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return [];
      }
      throw error;
    }
  }

  private async writeUsers(users: User[]): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(users, null, 2), "utf-8");
  }
}
