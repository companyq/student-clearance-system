// npm run seed
// Creates the seed login accounts in Supabase Auth and links them in tbl_users:
//   admin                                               / Admin@123
//   lib.officer, fin.officer, acc.officer, adm.officer  / Officer@123
//   24-1516, 24-1517, 24-1518 (the sample students)     / Student@123
// Run supabase/schema.sql first. Accounts that already exist are skipped.
// Change these passwords before any real use.
import { createClient } from "@supabase/supabase-js";
import { loadEnv, requireEnv } from "./env.mjs";

loadEnv();
const db = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});
const EMAIL_DOMAIN = "clearance.local"; // must match LOGIN_EMAIL_DOMAIN in src/lib/config.ts

const { data: departments, error: deptError } = await db.from("tbl_departments").select("department_id, department_name");
if (deptError) {
  console.error("Could not read tbl_departments. Did you run supabase/schema.sql first?", deptError.message);
  process.exit(1);
}
const deptId = (name) => departments.find((d) => d.department_name === name)?.department_id ?? null;

const accounts = [
  { username: "admin", password: "Admin@123", role: "Admin" },
  { username: "lib.officer", password: "Officer@123", role: "Officer", department_id: deptId("Library") },
  { username: "fin.officer", password: "Officer@123", role: "Officer", department_id: deptId("Finance") },
  { username: "acc.officer", password: "Officer@123", role: "Officer", department_id: deptId("Accommodation") },
  { username: "adm.officer", password: "Officer@123", role: "Officer", department_id: deptId("Administration") },
  { username: "24-1516", password: "Student@123", role: "Student", adm_no: "24-1516" },
  { username: "24-1517", password: "Student@123", role: "Student", adm_no: "24-1517" },
  { username: "24-1518", password: "Student@123", role: "Student", adm_no: "24-1518" },
];

let failed = false;
for (const a of accounts) {
  const { data: existing } = await db.from("tbl_users").select("user_id").eq("username", a.username).maybeSingle();
  if (existing) {
    console.log(`skip     ${a.username} (already exists)`);
    continue;
  }

  const { data: created, error: authError } = await db.auth.admin.createUser({
    email: `${a.username}@${EMAIL_DOMAIN}`,
    password: a.password,
    email_confirm: true,
  });
  if (authError) {
    console.error(`FAILED   ${a.username}: ${authError.message}`);
    failed = true;
    continue;
  }

  const { error } = await db.from("tbl_users").insert({
    user_id: created.user.id,
    username: a.username,
    role: a.role,
    department_id: a.department_id ?? null,
    adm_no: a.adm_no ?? null,
    is_active: true,
  });
  if (error) {
    await db.auth.admin.deleteUser(created.user.id);
    console.error(`FAILED   ${a.username}: ${error.message}`);
    failed = true;
    continue;
  }
  console.log(`created  ${a.username.padEnd(12)} ${a.role}`);
}

console.log(failed ? "\nSome accounts failed - see above." : "\nSeed complete. Run: npm run dev");
process.exitCode = failed ? 1 : 0;
