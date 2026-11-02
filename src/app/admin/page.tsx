import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PageHeader } from "@/components/app-shell";
import { CountUp, DepartmentBars, type DeptSummary } from "@/components/visuals";
import { IconArrowRight, IconBuilding, IconChart, IconSearch } from "@/components/icons";

export const metadata = { title: "Administrator Dashboard" };

/** System administrator home page: system totals and status by department. */
export default async function AdminDashboard() {
  const user = await requireRole("Admin");
  const supabase = await createClient();

  const requests = (status?: string) => {
    const q = supabase.from("tbl_clearance_requests").select("request_id", { count: "exact", head: true });
    return status ? q.eq("overall_status", status) : q;
  };
  const [students, all, cleared, pending, rejected, summary] = await Promise.all([
    supabase.from("tbl_students").select("student_id", { count: "exact", head: true }),
    requests(), requests("Cleared"), requests("Pending"), requests("Rejected"),
    supabase.rpc("report_status_summary"),
  ]);

  const stats = [
    { label: "Registered students", value: students.count ?? 0, color: "var(--brand)" },
    { label: "Requests submitted", value: all.count ?? 0, color: "var(--muted)" },
    { label: "Fully cleared", value: cleared.count ?? 0, color: "var(--good)" },
    { label: "In progress", value: pending.count ?? 0, color: "var(--warn)" },
    { label: "Rejected", value: rejected.count ?? 0, color: "var(--bad)" },
  ];
  const bars: DeptSummary[] = ((summary.data ?? []) as Record<string, string | number>[]).map((r) => ({
    department: String(r.Department),
    approved: Number(r.Approved),
    pending: Number(r.Pending),
    rejected: Number(r.Rejected),
  }));
  const anyItems = bars.some((b) => b.approved + b.pending + b.rejected > 0);

  const tiles = [
    { href: "/admin/students", icon: IconSearch, title: "Search & maintain students", text: "Find by admission number or name, edit records, view status" },
    { href: "/admin/reports", icon: IconChart, title: "Generate reports", text: "Cleared students, pending clearances, status by department" },
    { href: "/admin/users", icon: IconBuilding, title: "Users & departments", text: "Manage accounts, roles and departments" },
  ];

  return (
    <AppShell user={user}>
      <PageHeader eyebrow="System administrator" title={`Welcome, ${user.username}`} subtitle="An overview of clearance activity across the university." />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((s, i) => (
          <div key={s.label} className={`stat enter ${i === 0 ? "col-span-2 md:col-span-1" : ""}`} style={{ ["--i" as string]: i + 1 }}>
            <div className="stat-label"><span className="stat-dot" style={{ background: s.color }} />{s.label}</div>
            <div className="stat-value"><CountUp value={s.value} /></div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="card enter" style={{ ["--i" as string]: 6 }}>
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="card-title">Clearance items by department</h2>
            <Link href="/admin/reports?type=bydept&dept=0&run=1" className="text-sm font-semibold text-[var(--brand)] hover:underline">
              View as table
            </Link>
          </div>
          {anyItems ? (
            <DepartmentBars data={bars} />
          ) : (
            <p className="muted py-8 text-center text-sm">No clearance requests have been submitted yet.</p>
          )}
        </section>

        <div className="grid content-start gap-4">
          {tiles.map(({ href, icon: Ico, title, text }, i) => (
            <Link key={href} href={href} className="tile enter" style={{ ["--i" as string]: i + 7 }}>
              <span className="tile-icon"><Ico size={22} /></span>
              <span>
                <strong className="block">{title}</strong>
                <span className="muted text-sm">{text}</span>
              </span>
              <IconArrowRight size={18} className="tile-arrow" />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
