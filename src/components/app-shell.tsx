import { signOut } from "@/app/login/actions";
import type { AppUser } from "@/lib/auth";
import { UNIVERSITY } from "@/lib/config";
import { IconGraduation, IconLogout } from "./icons";
import { SideNav } from "./side-nav";

function initials(name: string): string {
  const parts = name.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
}

/** Page frame for logged-in users: sidebar navigation, user card and logout. */
export function AppShell({ user, children }: { user: AppUser; children: React.ReactNode }) {
  const roleText = user.role === "Officer" ? `${user.departmentName} Officer` : user.role === "Admin" ? "Administrator" : "Student";

  const footer = (
    <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="flex items-center gap-3">
        {/* Students' usernames are admission numbers, so they get an icon instead of "24" */}
        <span className="avatar">{user.role === "Student" ? <IconGraduation size={18} /> : initials(user.username)}</span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold text-white">{user.username}</span>
          <span className="block truncate text-xs text-indigo-200/80">{roleText}</span>
        </span>
      </div>
      <form action={signOut} className="mt-3">
        <button type="submit" className="side-link w-full justify-center bg-white/5 hover:bg-white/10">
          <IconLogout size={16} />
          Logout
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-full flex-1 flex-col lg:pl-64">
      <SideNav role={user.role} footer={footer} />
      <main className="app-main mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      <footer className="muted no-print mx-auto w-full max-w-6xl px-4 pb-6 text-xs sm:px-6 lg:px-10">
        {UNIVERSITY} · MIS 400A Student Clearance Management System
      </footer>
    </div>
  );
}

/** Title block at the top of every page, with optional buttons on the right. */
export function PageHeader({ eyebrow, title, subtitle, actions }: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="enter mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
