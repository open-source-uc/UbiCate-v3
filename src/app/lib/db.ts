import Database from "better-sqlite3";
import logger from "./logger";

let connection: Database.Database | null = null;

export function getDatabase() {
  if (connection) return connection;

  const filePath = process.env.BD_PATH || "./db.sqlite";

  // use controlled logger for DB verbose output
  // LOG_DB_LEVEL can be 'debug'|'info' etc. If LOG_DB_VERBOSE=1 and no LOG_DB_LEVEL specified, default to 'info'.
  const DB_LOG_LEVEL = process.env.LOG_DB_LEVEL
    || (process.env.LOG_DB_VERBOSE === '1' ? 'info' : (process.env.LOG_LEVEL === 'debug' ? 'debug' : ''));
  const DB_LOG_ENABLED = !!DB_LOG_LEVEL;
  connection = new Database(filePath, {
    verbose: DB_LOG_ENABLED
      ? (msg: any) => {
          const fn = (logger as any)[DB_LOG_LEVEL] || logger.info;
          fn.call(logger, msg);
        }
      : undefined,
  });
  connection.pragma("journal_mode = WAL");
  connection.pragma("foreign_keys = ON");

  return connection;
}

export const query = {
  all<T = unknown>(sql: string, params?: unknown) {
    const stmt = getDatabase().prepare(sql);
    const start = Date.now();
    const res = params === undefined ? (stmt.all() as T[]) : (stmt.all(params) as T[]);
    const duration = Date.now() - start;

    // conditional debug / slow query logging
    const DB_LOG_LEVEL_LOCAL = process.env.LOG_DB_LEVEL
      || (process.env.LOG_DB_VERBOSE === '1' ? 'info' : (process.env.LOG_LEVEL === 'debug' ? 'debug' : ''));
    const DB_LOG_ENABLED_LOCAL = !!DB_LOG_LEVEL_LOCAL;
    const SLOW_MS = Number(process.env.LOG_DB_SLOW_MS || '1000');
    if (DB_LOG_ENABLED_LOCAL) {
      const compactSql = (sql || '').replace(/\s+/g, ' ').trim();
      const paramsStr = params !== undefined ? ` params=${JSON.stringify(params)}` : '';
      const fn = (logger as any)[DB_LOG_LEVEL_LOCAL] || logger.info;
      fn.call(logger, `SQL select: ${compactSql}${paramsStr}`);
    }
    if (duration >= SLOW_MS) {
      const compactSql = (sql || '').replace(/\s+/g, ' ').trim();
      const paramsStr = params !== undefined ? ` params=${JSON.stringify(params)}` : '';
      logger.warn(`Slow DB query ${duration}ms: ${compactSql}${paramsStr}`);
    }

    return res;
  },
  get<T = unknown>(sql: string, params?: unknown) {
    const stmt = getDatabase().prepare(sql);
    const start = Date.now();
    const res = params === undefined ? (stmt.get() as T) : (stmt.get(params) as T);
    const duration = Date.now() - start;

    const DB_LOG_LEVEL_LOCAL = process.env.LOG_DB_LEVEL
      || (process.env.LOG_DB_VERBOSE === '1' ? 'info' : (process.env.LOG_LEVEL === 'debug' ? 'debug' : ''));
    const DB_LOG_ENABLED_LOCAL = !!DB_LOG_LEVEL_LOCAL;
    const SLOW_MS = Number(process.env.LOG_DB_SLOW_MS || '1000');
    if (DB_LOG_ENABLED_LOCAL) {
      const compactSql = (sql || '').replace(/\s+/g, ' ').trim();
      const paramsStr = params !== undefined ? ` params=${JSON.stringify(params)}` : '';
      const fn = (logger as any)[DB_LOG_LEVEL_LOCAL] || logger.info;
      fn.call(logger, `SQL get: ${compactSql}${paramsStr}`);
    }
    if (duration >= SLOW_MS) {
      const compactSql = (sql || '').replace(/\s+/g, ' ').trim();
      const paramsStr = params !== undefined ? ` params=${JSON.stringify(params)}` : '';
      logger.warn(`Slow DB query ${duration}ms: ${compactSql}${paramsStr}`);
    }

    return res;
  },
  run(sql: string, params?: unknown) {
    const stmt = getDatabase().prepare(sql);
    const start = Date.now();
    const res = params === undefined ? stmt.run() : stmt.run(params);
    const duration = Date.now() - start;

    const DB_LOG_LEVEL_LOCAL = process.env.LOG_DB_LEVEL
      || (process.env.LOG_DB_VERBOSE === '1' ? 'info' : (process.env.LOG_LEVEL === 'debug' ? 'debug' : ''));
    const DB_LOG_ENABLED_LOCAL = !!DB_LOG_LEVEL_LOCAL;
    const SLOW_MS = Number(process.env.LOG_DB_SLOW_MS || '1000');
    if (DB_LOG_ENABLED_LOCAL) {
      const compactSql = (sql || '').replace(/\s+/g, ' ').trim();
      const paramsStr = params !== undefined ? ` params=${JSON.stringify(params)}` : '';
      const fn = (logger as any)[DB_LOG_LEVEL_LOCAL] || logger.info;
      fn.call(logger, `SQL run: ${compactSql}${paramsStr}`);
    }
    if (duration >= SLOW_MS) {
      const compactSql = (sql || '').replace(/\s+/g, ' ').trim();
      const paramsStr = params !== undefined ? ` params=${JSON.stringify(params)}` : '';
      logger.warn(`Slow DB query ${duration}ms: ${compactSql}${paramsStr}`);
    }

    return res;
  },
  transaction<T>(fn: () => T, mode: "deferred" | "immediate" | "exclusive" = "deferred"): T {
    const tx = getDatabase().transaction(fn);
    return tx[mode]();
  },
};
