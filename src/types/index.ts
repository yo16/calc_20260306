/**
 * User entity stored in the repository.
 */
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

/**
 * Input for creating a new user.
 * passwordHash should already be hashed with bcrypt before passing here.
 */
export interface CreateUserInput {
  username: string;
  passwordHash: string;
}
