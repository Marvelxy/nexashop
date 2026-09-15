import { hash, compare } from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(plain: string) {
  return hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hashed: string) {
  return compare(plain, hashed);
}