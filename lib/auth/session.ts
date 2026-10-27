import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { findUserById, getDataRoot, type PublicUser } from "@/lib/db";

export const SESSION_COOKIE = "portrait_session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

let memorySecret: string | null = null;

const getSecret = () => {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv) return fromEnv;

  const file = path.join(getDataRoot(), "session.secret");
  try {
    if (!fs.existsSync(file)) {
      fs.mkdirSync(getDataRoot(), { recursive: true });
      fs.writeFileSync(file, randomBytes(32).toString("hex"), { encoding: "utf8" });
    }
    return fs.readFileSync(file, "utf8").trim();
  } catch {
    memorySecret ??= randomBytes(32).toString("hex");
    return memorySecret;
  }
};

const sign = (body: string) => {
  const signature = createHmac("sha256", getSecret()).update(body).digest("hex");
  return `${body}.${signature}`;
};

const readUserId = (token: string, now: number) => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [idPart, expiresPart, signature] = parts;
  if (!idPart || !expiresPart || !signature) return null;

  const expected = createHmac("sha256", getSecret())
    .update(`${idPart}.${expiresPart}`)
    .digest("hex");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  const expiresAt = Number(expiresPart);
  const userId = Number(idPart);
  if (!Number.isFinite(expiresAt) || expiresAt < now) return null;
  if (!Number.isInteger(userId) || userId <= 0) return null;
  return userId;
};

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

export const createSession = async (userId: number) => {
  await connection();
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const token = sign(`${userId}.${expiresAt}`);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions);
};

export const clearSession = async () => {
  await connection();
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
};

export const getCurrentUser = async (): Promise<PublicUser | null> => {
  await connection();
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const userId = readUserId(token, Date.now());
    if (!userId) return null;
    return await findUserById(userId);
  } catch {
    return null;
  }
};
