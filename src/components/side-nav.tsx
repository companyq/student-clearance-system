"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/lib/auth";
import {
  IconBuilding, IconChart, IconClipboardCheck, IconClose, IconDashboard, IconGraduation,
  IconListCheck, IconMenu, IconSearch, IconSend,
} from "./icons";

// Navigation for each role (the web version of the three desktop dashboards)
const NAV: Record<Role, { href: string; label: string; icon: React.ComponentType<{ size?: number }> }[]> = {
  Student: [
    { href: "/student", label: "Dashboard", icon: IconDashboard },
    { href: "/student/request", label: "Submit Request", icon: IconSend },
    { href: "/status", label: "My Clearance Status", icon: IconListCheck },
  ],
  Officer: [
    { href: "/officer", label: "Dashboard", icon: IconDashboard },
    { href: "/officer/process", label: "Process Clearance", icon: IconClipboardCheck },
  ],
  Admin: [
    { href: "/admin", label: "Dashboard", icon: IconDashboard },
    { href: "/admin/students", label: "Students", icon: IconSearch },
    { href: "/admin/reports", label: "Reports", icon: IconChart },
    { href: "/admin/users", label: "Users & Departments", icon: IconBuilding },
  ],
};

/** The most specific nav item matching the current address is highlighted. */
function activeHref(role: Role, path: string): string | null {
  const matches = NAV[role].filter((i) => path === i.href || path.startsWith(i.href + "/"));
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
}

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-[var(--accent)] ring-1 ring-white/15">
        <IconGraduation size={20} />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold text-white">Clearance System</span>
        <span className="block text-[11px] text-indigo-200/80">Daystar University</span>
      </span>
    </div>
  );
}

function Links({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const path = usePathname();
  const current = activeHref(role, path);
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV[role].map(({ href, label, icon: Ico }) => (
        <Link key={href} href={href} className="side-link" aria-current={href === current ? "page" : undefined} onClick={onNavigate}>
          <Ico size={18} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Desktop: fixed sidebar. Phone: top bar with a slide-out menu. */
export function SideNav({ role, footer }: { role: Role; footer: React.ReactNode }) {
  const [open, setOpen] = useState(false); // phone menu; links close it when tapped

  const panel = (
    <div className="flex h-full flex-col gap-8 px-4 py-6" style={{ background: "linear-gradient(180deg, var(--side-bg), var(--side-bg-2))" }}>
      <Brand />
      <div>
        <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-indigo-200/60">{role} menu</p>
        <Links role={role} onNavigate={() => setOpen(false)} />
      </div>
      <div className="mt-auto">{footer}</div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{panel}</aside>

      {/* Phone top bar */}
      <div
        className="no-print sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden"
        style={{ background: "var(--side-bg)", paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid size-10 place-items-center rounded-lg text-white hover:bg-white/10"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <IconMenu />
        </button>
      </div>

      {/* Phone slide-out menu */}
      <div className={`no-print fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <div className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-5 z-10 grid size-9 place-items-center rounded-lg text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <IconClose size={18} />
          </button>
          {panel}
        </div>
      </div>
    </>
  );
}
