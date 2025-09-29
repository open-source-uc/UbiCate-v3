// scripts/initdb.(ts|js)
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

type Opts = { db: string; schema: string };
const arg = (k: string, def?: string) => {
  const i = process.argv.indexOf(k);
  return i >= 0 ? process.argv[i + 1] : def;
};
const hasFlag = (k: string) => process.argv.includes(k);

const opts: Opts = {
  db: arg("--db", "./db.sqlite")!,
  schema: arg("--schema", "./seed.sql")!,
};

const FORCE =
  hasFlag("--force") ||
  process.env.INIT_FORCE === "1" ||
  process.env.npm_config_force === "true";

const dbPath = path.resolve(opts.db);
const schemaPath = path.resolve(opts.schema);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const isValidSqlite = (p: string) => {
  try {
    const buf = fs.readFileSync(p);
    if (buf.length < 100) return false;
    return buf.toString("utf8", 0, 16) === "SQLite format 3\0";
  } catch {
    return false;
  }
};

if (fs.existsSync(dbPath)) {
  const valid = isValidSqlite(dbPath);
  if (!FORCE && valid) {
    console.log(`🟢 DB existente y válida, no hago nada: ${dbPath}`);
    process.exit(0);
  }
  console.log(FORCE ? "⚠️ FORCE activo, recreando DB…" : "⚠️ DB corrupta/vacía, recreando…");
  try { fs.unlinkSync(dbPath); } catch {}
}

const sql = fs.readFileSync(schemaPath, "utf8");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec("BEGIN IMMEDIATE;");
try {
  db.exec(sql);
  db.exec("COMMIT;");
  console.log(`✅ DB creada: ${dbPath} usando ${schemaPath}`);
} catch (e) {
  db.exec("ROLLBACK;");
  throw e;
} finally {
  db.close();
}
