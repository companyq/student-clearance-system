"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dashboardFor, usernameToEmail, type Role } from "@/lib/auth";
import type { ActionState } from "@/lib/action-state";

/**
 * Login (objective 6). Supabase Auth checks the password (stored as a bcrypt
 * hash, never in plain text); tbl_users then decides the role and dashboard.
 */
export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Please enter both username and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  // Same message for unknown user and wrong password, so nobody can tell which usernames exist
  if (error || !data.user) return { error: "Invalid username or password." };

  const { data: account } = await supabase
    .from("tbl_users")
    .select("role, is_active")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!account) {
    await supabase.auth.signOut();
    return { error: "This login has no account record. Contact the system administrator." };
  }
  if (!account.is_active) {
    await supabase.auth.signOut();
    return { error: "This account has been deactivated. Please contact the system administrator." };
  }

  // Route by role, like frmLogin did
  redirect(dashboardFor(account.role as Role));
}

/** Logout: ends the Supabase session and returns to the login page. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
