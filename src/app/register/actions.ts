"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { usernameToEmail } from "@/lib/auth";
import type { ActionState } from "@/lib/action-state";
import { checkAdmNo, checkEmail, checkPassword, checkPhone, checkRequired, firstError } from "@/lib/validation";

/**
 * DFD 1.0 Register Student: Student -> student details -> D1 (tbl_students),
 * plus their login (Supabase Auth + tbl_users). Returns a registration confirmation.
 *
 * The student is not logged in yet, so this runs with the service key. That is
 * safe because the action only ever creates a Student account for the details
 * typed in, after validating them.
 */
export async function registerStudent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admNo = String(formData.get("adm_no") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  // 1. Validate the input
  const problem = firstError(
    checkAdmNo(admNo),
    checkRequired(fullName, "Full name"),
    checkRequired(course, "Course"),
    checkEmail(email),
    checkPhone(phone),
    checkPassword(password, confirm),
  );
  if (problem) return { error: problem };

  let db;
  try {
    db = createAdminClient();
  } catch {
    return { error: "The server is missing SUPABASE_SERVICE_ROLE_KEY. Contact the administrator." };
  }

  // 2. No duplicate admission numbers (the admission number is also the username)
  const [{ count: studentCount }, { count: userCount }] = await Promise.all([
    db.from("tbl_students").select("adm_no", { count: "exact", head: true }).eq("adm_no", admNo),
    db.from("tbl_users").select("user_id", { count: "exact", head: true }).eq("username", admNo),
  ]);
  if ((studentCount ?? 0) > 0 || (userCount ?? 0) > 0) {
    return { error: `A student with admission number ${admNo} is already registered.` };
  }

  // 3. Create the login. Supabase Auth hashes the password.
  const { data: created, error: authError } = await db.auth.admin.createUser({
    email: usernameToEmail(admNo),
    password,
    email_confirm: true,
  });
  if (authError || !created.user) {
    const duplicate = /already|exists|registered/i.test(authError?.message ?? "");
    return {
      error: duplicate
        ? `A student with admission number ${admNo} is already registered.`
        : `Could not create the login: ${authError?.message ?? "unknown error"}`,
    };
  }

  // 4. Save the student (D1) and link the login to it. If either insert fails,
  //    undo everything so a half-registered student is never left behind.
  const { error: studentError } = await db.from("tbl_students").insert({
    adm_no: admNo,
    full_name: fullName,
    course,
    email: email || null,
    phone: phone || null,
  });
  const { error: userError } = studentError
    ? { error: studentError }
    : await db.from("tbl_users").insert({
        user_id: created.user.id,
        username: admNo,
        role: "Student",
        adm_no: admNo,
      });

  if (studentError || userError) {
    await db.auth.admin.deleteUser(created.user.id);
    if (!studentError) await db.from("tbl_students").delete().eq("adm_no", admNo);
    const duplicate = (studentError ?? userError)?.code === "23505";
    return {
      error: duplicate
        ? `A student with admission number ${admNo} is already registered.`
        : "A database error occurred while saving the registration.",
    };
  }

  // 5. Registration confirmation is shown on the login page
  redirect(`/login?registered=${encodeURIComponent(admNo)}`);
}
