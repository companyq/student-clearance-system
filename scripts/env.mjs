// Reads .env.local into process.env for the setup scripts (Next.js does this
// itself for the app, but plain `node` scripts need it done by hand).
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export function loadEnv() {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) {
    console.error("Missing .env.local - copy .env.local.example to .env.local and fill it in.");
    process.exit(1);
  }
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is not set in .env.local.`);
    process.exit(1);
  }
  return value;
}
