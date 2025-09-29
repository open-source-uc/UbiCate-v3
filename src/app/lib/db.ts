import Database from "better-sqlite3";

let connection: Database.Database | null = null;

export function getDatabase() {
  if (connection) return connection;

  const filePath = process.env.BD_PATH || "./db.sqlite";

  connection = new Database(filePath, { verbose: console.log });
  connection.pragma("journal_mode = WAL");
  connection.pragma("foreign_keys = ON");

  return connection;
}

export const query = {
  all<T = unknown>(sql: string, params?: unknown) {
    const stmt = getDatabase().prepare(sql);
    return params === undefined ? (stmt.all() as T[]) : (stmt.all(params) as T[]);
  },
  get<T = unknown>(sql: string, params?: unknown) {
    const stmt = getDatabase().prepare(sql);
    return params === undefined ? (stmt.get() as T) : (stmt.get(params) as T);
  },
  run(sql: string, params?: unknown) {
    const stmt = getDatabase().prepare(sql);
    return params === undefined ? stmt.run() : stmt.run(params);
  },
  transaction<T>(fn: () => T, mode: "deferred" | "immediate" | "exclusive" = "deferred"): T {
    const tx = getDatabase().transaction(fn);
    return tx[mode]();
  },
};
