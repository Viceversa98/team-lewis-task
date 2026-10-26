import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export type PasswordHash = {
  hash: string;
  salt: string;
};

export const hashPassword = (password: string): PasswordHash => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return { hash, salt };
};

export const verifyPassword = (
  password: string,
  hash: string,
  salt: string,
) => {
  const actual = scryptSync(password, salt, KEY_LENGTH);
  const stored = Buffer.from(hash, "hex");
  if (stored.length !== actual.length) return false;
  return timingSafeEqual(stored, actual);
};
