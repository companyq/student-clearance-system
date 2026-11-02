import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import UsersPanel, { type Department, type UserRow } from "./users-panel";
import DepartmentsPanel from "./departments-panel";

export const metadata = { title: "Users and Departments" };

/** System administrator: manage user accounts and departments. */
export default async function UsersPage() {
  const user = await requireRole("Admin");
  const supabase = await createClient();

  const [{ data: users, error }, { data: departments }] = await Promise.all([
    supabase
      .from("tbl_users")
      .select("user_id, username, role, department_id, adm_no, is_active, tbl_departments(department_name)")
      .order("role")
      .order("username"),
    supabase.from("tbl_departments").select("department_id, department_name").order("department_id"),
  ]);

  const rows: UserRow[] = (users ?? []).map((u) => ({
    user_id: u.user_id,
    username: u.username,
    role: u.role,
    department_id: u.department_id,
    department: (u.tbl_departments as unknown as { department_name: string } | null)?.department_name ?? null,
    adm_no: u.adm_no,
    is_active: u.is_active,
  }));

  return (
    <AppShell user={user}>
      <PageHeader eyebrow="Administration" title="Users & Departments" subtitle="Manage who can log in, their access level, and the departments that clear students." />
      {error && <Notice kind="bad">A database error occurred while loading the user accounts.</Notice>}

      <UsersPanel users={rows} departments={(departments ?? []) as Department[]} myUserId={user.userId} />

      <div className="mt-10">
        <DepartmentsPanel departments={(departments ?? []) as Department[]} />
      </div>
    </AppShell>
  );
}
