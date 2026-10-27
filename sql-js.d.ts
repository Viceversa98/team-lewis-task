declare module "sql.js" {
  export type SqlJsConfig = {
    wasmBinary?: ArrayBuffer | Uint8Array;
  };

  export class Statement {
    bind(values?: unknown[] | Record<string, unknown>): boolean;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): boolean;
  }

  export class Database {
    constructor(data?: ArrayLike<number> | Buffer | null);
    run(sql: string): Database;
    exec(sql: string): { columns: string[]; values: unknown[][] }[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export type SqlJsStatic = {
    Database: typeof Database;
  };

  const initSqlJs: (config?: SqlJsConfig) => Promise<SqlJsStatic>;
  export default initSqlJs;
}

declare module "sql.js/dist/sql-wasm-inline.js" {
  import type { SqlJsStatic } from "sql.js";
  const initSqlJs: (config?: object) => Promise<SqlJsStatic>;
  export default initSqlJs;
}
