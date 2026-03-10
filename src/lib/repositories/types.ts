import { User, CreateUserInput } from "@/types";

/**
 * Repository interface for user data access.
 * Implementations can be swapped for different storage backends (file, DB, etc.).
 */
export interface UserRepository {
  findByUsername(username: string): Promise<User | null>;
  create(user: CreateUserInput): Promise<User>;
  existsByUsername(username: string): Promise<boolean>;
}
