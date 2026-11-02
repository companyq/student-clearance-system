"use server";

import { revalidatePath } from "next/cache";
import { requireRole, usernameToEmail, type Role } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { friendlyDbError } from "@/lib/format";
import type { ActionState } from "@/lib/action-state";
import { checkPassword, checkRequired, checkUsername, firstError } from "@/lib/validation";

// Long enough to mean "until reactivated"
const BAN_FOREVER = "876000h";

/**
 * Add or edit a user account (System Administrator: manages user accounts).
 *  - New: Admin or Officer accounts only; students create theirs by registering.
 *  - Edit: change role/department, activate/deactivate, optionally reset the password.
 * Login accounts live in Supabase Auth, so this uses the service key, but only
 * after requireRole("Admin") has confirmed the caller is an administrator.
 */
export async function saveUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireRole("Admin");
  const userId = String(formData.get("user_id") ?? "");
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  let role = String(formData.get("role") ?? "") as Role;
  const isActive = formData.get("is_active") === "on";
  const deptRaw = Number.parseInt(String(formData.get("department_id") ?? ""), 10);
  const isNew = userId === "";

  if (!["Admin", "Officer", "Student"].includes(role)) return { error: "Please choose a role." };

  const db = createAdminClient();

  // Editing: a student's role is fixed, and you cannot lock yourself out
  if (!isNew) {
    const { data: existing } = await db.from("tbl_users").select("role").eq("user_id", userId).maybeSingle();
    if (!existing) return { error: "That user no longer exists." };
    if (existing.role === "Student") role = "Student";
    else if (role === "Student") return { error: "Student accounts are created when the student registers from the login page." };
    if (userId === me.userId && role !== "Admin") return { error: "You cannot remove the Admin role from your own account." };
    if (userId === me.userId && !isActive) return { error: "You cannot deactivate your own account." };
  } else if (role === "Student") {
    return { error: "Student accounts are created when the student registers from the login page." };
  }

  const departmentId = role === "Officer" ? (Number.isInteger(deptRaw) && deptRaw > 0 ? deptRaw : null) : null;
  const problem = firstError(
    isNew ? checkUsername(username) : checkRequired(username, "Username"),
    isNew || password ? checkPassword(password, password) : null,
    role === "Officer" && departmentId === null ? "Please choose the officer's department." : null,
  );
  if (problem) return { error: problem };

  if (isNew) {
    const { count } = await db.from("tbl_users").select("user_id", { count: "exact", head: true }).eq("username", username);
    if ((count ?? 0) > 0) return { error: `The username '${username}' is already taken.` };

    const { data: created, error: authError } = await db.auth.admin.createUser({
      email: usernameToEmail(username),
      password,
      email_confirm: true,
    });
    if (authError || !created.user) return { error: `The username '${username}' is already taken.` };

    const { error } = await db.from("tbl_users").insert({
      user_id: created.user.id,
      username,
      role,
      department_id: departmentId,
      is_active: true,
    });
    if (error) {
      await db.auth.admin.deleteUser(created.user.id); // undo the login so nothing is half-created
      return { error: friendlyDbError("save the user account", error) };
    }
    revalidatePath("/admin/users");
    return { message: `User '${username}' added.` };
  }

  const { error } = await db
    .from("tbl_users")
    .update({ role, department_id: departmentId, is_active: isActive })
    .eq("user_id", userId);
  if (error) return { error: friendlyDbError("save the user account", error) };

  // Deactivated accounts are also blocked by Supabase Auth itself, not just by the app
  const { error: authError } = await db.auth.admin.updateUserById(userId, {
    ...(password ? { password } : {}),
    ban_duration: isActive ? "none" : BAN_FOREVER,
  });
  if (authError) return { error: `Account saved, but the login could not be updated: ${authError.message}` };

  revalidatePath("/admin/users");
  return { message: `User '${username}' updated.${password ? " The password has been reset." : ""}` };
}

/** Add a department (applies to requests submitted after it is added). */
export async function addDepartment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("Admin");
  const name = String(formData.get("department_name") ?? "").trim();
  const problem = checkRequired(name, "Department name");
  if (problem) return { error: problem };

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_department", { p_name: name });
  if (error) return { error: friendlyDbError("add the department", error) };

  revalidatePath("/admin/users");
  return { message: `Department '${name}' added.` };
}

export async function renameDepartment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("Admin");
  const id = Number.parseInt(String(formData.get("department_id") ?? ""), 10);
  const name = String(formData.get("department_name") ?? "").trim();
  if (!Number.isInteger(id) || id <= 0) return { error: "Select a department to rename." };
  const problem = checkRequired(name, "Department name");
  if (problem) return { error: problem };

  const supabase = await createClient();
  const { error } = await supabase.rpc("rename_department", { p_department_id: id, p_name: name });
  if (error) return { error: friendlyDbError("rename the department", error) };

  revalidatePath("/admin/users");
  return { message: "Department renamed." };
}
