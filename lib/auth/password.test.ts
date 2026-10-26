import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("round-trips a password and rejects a different one", () => {
    const first = hashPassword("correct-horse");
    const second = hashPassword("correct-horse");

    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
    expect(verifyPassword("correct-horse", first.hash, first.salt)).toBe(true);
    expect(verifyPassword("wrong-horse", first.hash, first.salt)).toBe(false);
  });
});
