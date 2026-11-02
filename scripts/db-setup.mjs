// npm run db:setup
// Runs supabase/schema.sql against your Supabase database (tables, security
// rules, functions, departments and sample students). Safe to run again.
// Needs DATABASE_URL in .env.local (Supabase: Connect -> Session pooler URI).
// Alternative: paste supabase/schema.sql into the Supabase SQL Editor and click Run.
import { readFileSync } from "node:fs";
import pg from "pg";
import { loadEnv, requireEnv } from "./env.mjs";

loadEnv();
const client = new pg.Client({
  connectionString: requireEnv("DATABASE_URL"),
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8"));
  const { rows } = await client.query(
    "select (select count(*) from tbl_departments) as departments, (select count(*) from tbl_students) as students",
  );
  console.log(`Database ready: ${rows[0].departments} departments, ${rows[0].students} students.`);
  console.log("Next: npm run seed   (creates the admin, officer and student logins)");
} catch (err) {
  console.error("Database setup failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
