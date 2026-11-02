import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { AppShell, PageHeader } from "@/components/app-shell";
import { EmptyState } from "@/components/notice";
import { CountUp } from "@/components/visuals";
import { IconArrowRight, IconCheckCircle, IconClipboardCheck } from "@/components/icons";

export const metadata = { title: "Officer Dashboard" };

/** Departmental officer home page: their department's workload at a glance. */
export default async function OfficerDashboard() {
  const user = await requireRole("Officer");
  const supabase = await createClient();
  const dept = user.departmentId!;

  // Row-Level Security limits these to the officer's own department
  const count = (status: string) =>
    supabase.from("tbl_clearance_status").select("status_id", { count: "exact", head: true })
      .eq("department_id", dept).eq("status", status);
  const [pending, approved, rejected, queue] = await Promise.all([
    count("Pending"), count("Approved"), count("Rejected"),
    supabase.rpc("get_department_queue", { p_include_rejected: false }),
  ]);
  const waiting = ((queue.data ?? []) as { status_id: number; adm_no: string; full_name: string; date_submitted: string }[]).slice(0, 5);

  const stats = [
    { label: "Waiting for review", value: pending.count ?? 0, color: "var(--warn)" },
    { label: "Approved", value: approved.count ?? 0, color: "var(--good)" },
    { label: "Rejected", value: rejected.count ?? 0, color: "var(--bad)" },
  ];

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow={`${user.departmentName} department`}
        title={`Welcome, ${user.username}`}
        subtitle="Review clearance requests for your department."
        actions={<Link href="/officer/process" className="btn btn-brand"><IconClipboardCheck size={18} /> Process requests</Link>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div key={s.label} className="stat enter" style={{ ["--i" as string]: i + 1 }}>
            <div className="stat-label"><span className="stat-dot" style={{ background: s.color }} />{s.label}</div>
            <div className="stat-value"><CountUp value={s.value} /></div>
          </div>
        ))}
      </div>

      <section className="card card-flush enter" style={{ ["--i" as string]: 4 }}>
        <div className="card-header">
          <h2 className="card-title">Next in your queue</h2>
          <Link href="/officer/process" className="btn btn-sm btn-ghost">Open queue <IconArrowRight size={14} /></Link>
        </div>
        {waiting.length === 0 ? (
          <EmptyState icon={<IconCheckCircle size={26} />} title="All caught up">
            No requests are waiting for {user.departmentName}.
          </EmptyState>
        ) : (
          <ul>
            {waiting.map((w) => (
              <li key={w.status_id} className="flex items-center gap-4 border-b border-[var(--line)] px-6 py-3.5 last:border-b-0">
                <span className="avatar !bg-none !bg-[var(--brand-soft)] !text-[var(--brand)]">{w.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{w.full_name}</p>
                  <p className="muted text-sm">{w.adm_no} · submitted {formatDateTime(w.date_submitted)}</p>
                </div>
                <span className="badge badge-Pending">Pending</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
