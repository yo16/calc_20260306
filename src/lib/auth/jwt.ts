import jwt from "jsonwebtoken";
import { JwtPayload } from "@/types";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

/**
 * Generate a signed JWT containing userId and email.
 */
export function generateToken(payload: {
  userId: string;
  email: string;
}): string {
  const secret = getSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || "24h";
  return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] });
}

/**
 * Verify and decode a JWT.
 * Returns the decoded payload on success, or null on failure
 * (expired, tampered, malformed, etc.).
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = getSecret();
    const decoded = jwt.verify(token, secret);
    return decoded as JwtPayload;
  } catch {
    return null;
  }
}
