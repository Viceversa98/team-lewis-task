import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import {
  closeDatabase,
  createUser,
  getDataRoot,
  getDb,
  setDataRoot,
} from "@/lib/db";
import {
  NO_FACE_MESSAGE,
  SIGN_IN_TO_UPLOAD,
  USE_IMAGE,
} from "@/lib/messages";
import { neutralFace } from "../../tests/landmarks";
import { readSmile } from "@/app/bench/actions";
import { initialReadSmileState } from "@/lib/smile/state";

const { cookieJar } = vi.hoisted(() => ({
  cookieJar: new Map<string, string>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value ? { name, value } : undefined;
    },
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
}));

vi.mock("next/cache", () => ({
  refresh: () => {},
}));

vi.mock("next/server", () => ({
  connection: async () => {},
}));

vi.mock("next/navigation", () => ({
  redirect: (destination: string) => {
    throw new Error(`REDIRECT:${destination}`);
  },
}));

const jpeg = () => new File([Uint8Array.from([0xff, 0xd8, 0xff, 0xd9])], "portrait.jpg", {
  type: "image/jpeg",
});

const countPortraits = () => {
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS count FROM portraits`)
    .get() as { count: number };
  return row.count;
};

const signIn = async () => {
  const { hash, salt } = hashPassword("correct-horse");
  const user = createUser({
    name: "Amina Cole",
    email: "amina@example.com",
    passwordHash: hash,
    salt,
  });
  await createSession(user.id);
  return user;
};

describe("readSmile", () => {
  let root = "";

  beforeEach(() => {
    cookieJar.clear();
    closeDatabase();
    root = fs.mkdtempSync(path.join(os.tmpdir(), "portrait-bench-"));
    setDataRoot(root);
    process.env.SESSION_SECRET = "test-session-secret";
  });

  afterEach(() => {
    closeDatabase();
    if (root) fs.rmSync(root, { recursive: true, force: true });
  });

  it("rejects a signed-out reading before storing anything", async () => {
    const formData = new FormData();
    formData.set("portrait", jpeg());
    formData.set("landmarks", JSON.stringify(neutralFace()));

    const result = await readSmile(initialReadSmileState, formData);

    expect(result).toEqual({
      score: null,
      error: SIGN_IN_TO_UPLOAD,
      readingId: null,
    });
    expect(countPortraits()).toBe(0);
    expect(fs.existsSync(path.join(getDataRoot(), "portraits"))).toBe(false);
  });

  it("rejects a portrait with no face and does not store a score", async () => {
    await signIn();
    const formData = new FormData();
    formData.set("portrait", jpeg());
    formData.set("landmarks", "[]");

    const result = await readSmile(initialReadSmileState, formData);

    expect(result.error).toBe(NO_FACE_MESSAGE);
    expect(result.score).toBeNull();
    expect(countPortraits()).toBe(0);
    expect(fs.existsSync(path.join(root, "portraits"))).toBe(false);
  });

  it("rejects a non-image file", async () => {
    await signIn();
    const formData = new FormData();
    formData.set(
      "portrait",
      new File(["hello"], "notes.txt", { type: "text/plain" }),
    );
    formData.set("landmarks", JSON.stringify(neutralFace()));

    const result = await readSmile(initialReadSmileState, formData);

    expect(result.error).toBe(USE_IMAGE);
    expect(countPortraits()).toBe(0);
  });

  it("stores the portrait and the recomputed score", async () => {
    const user = await signIn();
    const formData = new FormData();
    formData.set("portrait", jpeg());
    formData.set("landmarks", JSON.stringify(neutralFace()));

    const result = await readSmile(initialReadSmileState, formData);

    expect(result.error).toBeNull();
    expect(result.score).toBe(34);
    expect(result.readingId).toBeGreaterThan(0);
    expect(countPortraits()).toBe(1);

    const row = getDb()
      .prepare(
        `SELECT user_id AS userId, score, file_path AS filePath FROM portraits WHERE id = ?`,
      )
      .get(result.readingId) as { userId: number; score: number; filePath: string };

    expect(row.userId).toBe(user.id);
    expect(row.score).toBe(34);
    expect(fs.existsSync(path.join(root, row.filePath))).toBe(true);
  });
});
