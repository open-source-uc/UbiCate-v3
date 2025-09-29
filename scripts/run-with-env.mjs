import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = process.cwd();

// --- parse flags propios ---
const argv = process.argv.slice(2);          // ej: ["dev"] o ["build", "--branch", "des", "--force-db"]
const idxBranch = Math.max(argv.indexOf("--branch"), argv.indexOf("-b"));
const idxForceDb = argv.indexOf("--force-db");

// rama: --branch <x> > BRANCH > CI_COMMIT_REF_NAME > "local"
const branch =
  (idxBranch >= 0 && argv[idxBranch + 1]) ||
  process.env.BRANCH ||
  (process.env.GITLAB_CI ? process.env.CI_COMMIT_REF_NAME : "local");

// si piden --force-db, propaga para init-db
if (idxForceDb >= 0) process.env.INIT_FORCE = "1";

// SOLO: env/.env.local o env/.env.<rama>
const envFile = branch === "local" ? "env/.env.local" : `env/.env.${branch}`;
const envPath = path.join(projectRoot, envFile);
if (!existsSync(envPath)) {
  console.error(`❌ Falta ${envFile}`);
  process.exit(1);
}

dotenv.config({ path: envPath, override: true });
console.log(`🌱 usando ${envFile} (branch=${branch})`);

// limpia flags propios antes de pasar a next
const nextArgs = argv.filter((_, i) => {
  if (i === idxBranch || i === idxBranch + 1) return false;
  if (i === idxForceDb) return false;
  return true;
});

// bin de next cross-platform
const nextBin = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next"
);

const child = spawn(nextBin, nextArgs, {
  stdio: "inherit",
  shell: process.platform === "win32",
  cwd: projectRoot,
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 0));
