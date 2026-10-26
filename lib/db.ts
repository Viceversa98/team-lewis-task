import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type PublicUser = {
  id: number;
  name: string;
  email: string;
};

export type StoredUser = PublicUser & {
  passwordHash: string;
  salt: string;
};

export type PortraitRecord = {
  id: number;
  score: number;
  createdAt: string;
  filePath: string;
};

let dataRoot = path.join(process.cwd(), "data");
let database: Database.Database | null = null;

export const getDataRoot = () => dataRoot;

export const setDataRoot = (nextRoot: string) => {
  if (database) {
    database.close();
    database = null;
  }
  dataRoot = nextRoot;
};

export const closeDatabase = () => {
  if (!database) return;
  database.close();
  database = null;
};

const migrate = (db: Database.Database) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS portraits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      file_path TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS portraits_user_id ON portraits(user_id);
  `);
};

export const getDb = () => {
  if (database) return database;
  fs.mkdirSync(dataRoot, { recursive: true });
  database = new Database(path.join(dataRoot, "portrait.sqlite"));
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  migrate(database);
  return database;
};

export const isUniqueConstraint = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code: unknown }).code === "SQLITE_CONSTRAINT_UNIQUE";

export const createUser = (input: {
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
}): PublicUser => {
  const result = getDb()
    .prepare(
      `INSERT INTO users (name, email, password_hash, salt) VALUES (?, ?, ?, ?)`,
    )
    .run(input.name, input.email, input.passwordHash, input.salt);

  return {
    id: Number(result.lastInsertRowid),
    name: input.name,
    email: input.email,
  };
};

export const findUserByEmail = (email: string): StoredUser | null => {
  const row = getDb()
    .prepare(
      `SELECT id, name, email, password_hash AS passwordHash, salt
       FROM users WHERE email = ?`,
    )
    .get(email) as StoredUser | undefined;

  return row ?? null;
};

export const findUserById = (id: number): PublicUser | null => {
  const row = getDb()
    .prepare(`SELECT id, name, email FROM users WHERE id = ?`)
    .get(id) as PublicUser | undefined;

  return row ?? null;
};

export const insertPortrait = (input: {
  userId: number;
  filePath: string;
  score: number;
  createdAt: string;
}) => {
  const result = getDb()
    .prepare(
      `INSERT INTO portraits (user_id, file_path, score, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(input.userId, input.filePath, input.score, input.createdAt);

  return Number(result.lastInsertRowid);
};

export const listPortraits = (userId: number): PortraitRecord[] =>
  getDb()
    .prepare(
      `SELECT id, score, created_at AS createdAt, file_path AS filePath
       FROM portraits
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
    )
    .all(userId) as PortraitRecord[];

export const getPortraitForUser = (
  userId: number,
  portraitId: number,
): PortraitRecord | null => {
  const row = getDb()
    .prepare(
      `SELECT id, score, created_at AS createdAt, file_path AS filePath
       FROM portraits
       WHERE id = ? AND user_id = ?`,
    )
    .get(portraitId, userId) as PortraitRecord | undefined;

  return row ?? null;
};
