import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashVerificationCode(code: string): Promise<string> {
  return bcrypt.hash(code, SALT_ROUNDS);
}

export async function compareCodeHash(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
