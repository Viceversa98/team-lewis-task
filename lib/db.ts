import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import initSqlJs, { type Database as SqlJsDatabase, type SqlJsStatic } from "sql.js";

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

type Statement = {
  get: (...params: unknown[]) => unknown;
  all: (...params: unknown[]) => unknown[];
  run: (...params: unknown[]) => { lastInsertRowid: number };
};

export type AppDatabase = {
  prepare: (sql: string) => Statement;
};

const require = createRequire(import.meta.url);

const canWrite = (directory: string) => {
  try {
    fs.mkdirSync(directory, { recursive: true });
    fs.accessSync(directory, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
};

const resolveDataRoot = () => {
  const fromEnv = process.env.DATA_DIR;
  if (fromEnv) return fromEnv;

  const local = path.join(process.cwd(), "data");
  if (canWrite(local)) return local;
  return path.join(os.tmpdir(), "portrait-bench");
};

const dbPath = () => path.join(dataRoot, "portrait.sqlite");

const wasmPath = () => {
  try {
    return require.resolve("sql.js/dist/sql-wasm.wasm");
  } catch {
    return path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm");
  }
};

let dataRoot = resolveDataRoot();
let engine: SqlJsStatic | null = null;
let database: SqlJsDatabase | null = null;
let opening: Promise<SqlJsDatabase> | null = null;

export const getDataRoot = () => dataRoot;

export const setDataRoot = (nextRoot: string) => {
  closeDatabase();
  dataRoot = nextRoot;
};

const persist = (db: SqlJsDatabase) => {
  fs.mkdirSync(dataRoot, { recursive: true });
  fs.writeFileSync(dbPath(), Buffer.from(db.export()));
};

const migrate = (db: SqlJsDatabase) => {
  db.run(`
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

const loadEngine = async () => {
  if (engine) return engine;
  const wasmBinary = fs.readFileSync(wasmPath());
  engine = await initSqlJs({ wasmBinary });
  return engine;
};

const openDatabase = async () => {
  const sql = await loadEngine();
  fs.mkdirSync(dataRoot, { recursive: true });
  const file = dbPath();
  const db = fs.existsSync(file)
    ? new sql.Database(fs.readFileSync(file))
    : new sql.Database();
  migrate(db);
  persist(db);
  return db;
};

const ensureDb = async () => {
  if (database) return database;
  if (!opening) {
    opening = openDatabase()
      .then((db) => {
        database = db;
        opening = null;
        return db;
      })
      .catch((error: unknown) => {
        opening = null;
        throw error;
      });
  }
  return opening;
};

const lastInsertRowid = (db: SqlJsDatabase) => {
  const result = db.exec("SELECT last_insert_rowid() AS id");
  return Number(result[0]?.values[0]?.[0] ?? 0);
};

const bind = (db: SqlJsDatabase, sql: string, params: unknown[]) => {
  const statement = db.prepare(sql);
  if (params.length > 0) statement.bind(params);
  return statement;
};

const getRow = (db: SqlJsDatabase, sql: string, params: unknown[]) => {
  const statement = bind(db, sql, params);
  try {
    if (!statement.step()) return undefined;
    return statement.getAsObject();
  } finally {
    statement.free();
  }
};

const allRows = (db: SqlJsDatabase, sql: string, params: unknown[]) => {
  const statement = bind(db, sql, params);
  const rows: Record<string, unknown>[] = [];
  try {
    while (statement.step()) rows.push(statement.getAsObject());
    return rows;
  } finally {
    statement.free();
  }
};

const runSql = (db: SqlJsDatabase, sql: string, params: unknown[]) => {
  const statement = bind(db, sql, params);
  try {
    statement.step();
    persist(db);
    return { lastInsertRowid: lastInsertRowid(db) };
  } finally {
    statement.free();
  }
};

export const closeDatabase = () => {
  if (database) {
    persist(database);
    database.close();
  }
  database = null;
  opening = null;
};

export const getDb = async (): Promise<AppDatabase> => {
  const db = await ensureDb();
  return {
    prepare: (sql: string) => ({
      get: (...params: unknown[]) => getRow(db, sql, params),
      all: (...params: unknown[]) => allRows(db, sql, params),
      run: (...params: unknown[]) => runSql(db, sql, params),
    }),
  };
};

export const isUniqueConstraint = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("UNIQUE");
};

export const createUser = async (input: {
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
}): Promise<PublicUser> => {
  const db = await ensureDb();
  const result = runSql(
    db,
    `INSERT INTO users (name, email, password_hash, salt) VALUES (?, ?, ?, ?)`,
    [input.name, input.email, input.passwordHash, input.salt],
  );

  return {
    id: result.lastInsertRowid,
    name: input.name,
    email: input.email,
  };
};

export const findUserByEmail = async (email: string): Promise<StoredUser | null> => {
  const db = await ensureDb();
  const row = getRow(
    db,
    `SELECT id, name, email, password_hash AS passwordHash, salt
     FROM users WHERE email = ?`,
    [email],
  ) as StoredUser | undefined;
  return row ?? null;
};

export const findUserById = async (id: number): Promise<PublicUser | null> => {
  const db = await ensureDb();
  const row = getRow(
    db,
    `SELECT id, name, email FROM users WHERE id = ?`,
    [id],
  ) as PublicUser | undefined;
  return row ?? null;
};

export const insertPortrait = async (input: {
  userId: number;
  filePath: string;
  score: number;
  createdAt: string;
}) => {
  const db = await ensureDb();
  return runSql(
    db,
    `INSERT INTO portraits (user_id, file_path, score, created_at)
     VALUES (?, ?, ?, ?)`,
    [input.userId, input.filePath, input.score, input.createdAt],
  ).lastInsertRowid;
};

export const listPortraits = async (userId: number): Promise<PortraitRecord[]> => {
  const db = await ensureDb();
  return allRows(
    db,
    `SELECT id, score, created_at AS createdAt, file_path AS filePath
     FROM portraits
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC`,
    [userId],
  ) as PortraitRecord[];
};

export const getPortraitForUser = async (
  userId: number,
  portraitId: number,
): Promise<PortraitRecord | null> => {
  const db = await ensureDb();
  const row = getRow(
    db,
    `SELECT id, score, created_at AS createdAt, file_path AS filePath
     FROM portraits
     WHERE id = ? AND user_id = ?`,
    [portraitId, userId],
  ) as PortraitRecord | undefined;
  return row ?? null;
};
