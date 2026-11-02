import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LOGIN_EMAIL_DOMAIN, isSupabaseConfigured } from "@/lib/config";

// Objective 6: secure login with different access levels.

export type Role = "Admin" | "Officer" | "Student";

/** The logged-in user's account details from tbl_users. */
export interface AppUser {
  userId: string;
  username: string;
  role: Role;
  departmentId: number | null;   // officers only
  departmentName: string | null; // officers only
  admNo: string | null;          // students only
  isActive: boolean;
}

/** Turns a username (e.g. "24-1516" or "lib.officer") into the internal login email. */
export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`;
}

/** Where each role lands after logging in. */
export function dashboardFor(role: Role): string {
  if (role === "Admin") return "/admin";
  if (role === "Officer") return "/officer";
  return "/student";
}

/** The current user, or null if nobody is logged in. */
export async function getAppUser(): Promise<AppUser | null> {
  // Who is logged in differs per request, so pages that check it are never pre-built
  await connection();
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("tbl_users")
    .select("user_id, username, role, department_id, adm_no, is_active, tbl_departments(department_name)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;

  const dept = data.tbl_departments as unknown as { department_name: string } | null;
  return {
    userId: data.user_id,
    username: data.username,
    role: data.role as Role,
    departmentId: data.department_id,
    departmentName: dept?.department_name ?? null,
    admNo: data.adm_no,
    isActive: data.is_active,
  };
}

/**
 * Guard for every protected page. Not logged in -> login page.
 * Deactivated -> login page with a message. Wrong role -> their own dashboard.
 */
export async function requireRole(...allowed: Role[]): Promise<AppUser> {
  const user = await getAppUser();
  if (!user) redirect("/login");
  if (!user.isActive) redirect("/login?error=disabled");
  if (!allowed.includes(user.role)) redirect(dashboardFor(user.role));
  return user;
}
