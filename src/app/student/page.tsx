import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, requestRef } from "@/lib/format";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/notice";
import { ProgressRing } from "@/components/visuals";
import { DepartmentTracker, type DeptStatus } from "@/components/department-tracker";
import { IconArrowRight, IconListCheck, IconSend } from "@/components/icons";

export const metadata = { title: "Student Dashboard" };

interface StatusRow extends DeptStatus {
  request_id: number;
  date_submitted: string;
  overall_status: string;
}

/** Student home page: overall clearance progress and each department's status. */
export default async function StudentDashboard() {
  const user = await requireRole("Student");
  const supabase = await createClient();

  // Row-Level Security / the function only return this student's own data
  const [{ data: student }, { data }] = await Promise.all([
    supabase.from("tbl_students").select("full_name, course").eq("adm_no", user.admNo!).maybeSingle(),
    supabase.rpc("get_clearance_status", { p_adm_no: user.admNo! }),
  ]);
  const rows = (data ?? []) as StatusRow[];
  const first = rows[0];
  const approved = rows.filter((r) => r.status === "Approved").length;
  const firstName = (student?.full_name ?? user.username).split(" ")[0];

  const message = !first
    ? "You haven't submitted a clearance request yet. Submit one to start the process."
    : first.overall_status === "Cleared"
      ? "Congratulations, every department has approved your clearance."
      : first.overall_status === "Rejected"
        ? "One or more departments rejected your request. Check the reasons below and follow up with them."
        : "Your request is being reviewed. Each department's decision appears below.";

  return (
    <AppShell user={user}>
      <PageHeader eyebrow="Student" title={`Welcome, ${firstName}`} subtitle={`${user.admNo} · ${student?.course ?? ""}`} />

      <section className="card enter mb-6 overflow-hidden p-0" style={{ ["--i" as string]: 1 }}>
        <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
          <ProgressRing done={approved} total={first ? rows.length : 4} />
          <div>
            <p className="eyebrow">Overall clearance status</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {first ? <StatusBadge status={first.overall_status} /> : <span className="badge badge-Pending">Not submitted</span>}
              {first && <span className="muted text-sm">{requestRef(first.request_id)} · submitted {formatDateTime(first.date_submitted)}</span>}
            </div>
            <p className="mt-3 max-w-xl text-[var(--ink-2)]">{message}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {first ? (
                <Link href="/status" className="btn btn-brand">View full status <IconArrowRight size={16} /></Link>
              ) : (
                <Link href="/student/request" className="btn btn-brand">Submit clearance request <IconArrowRight size={16} /></Link>
              )}
            </div>
          </div>
        </div>
        {first && (
          <div className="border-t border-[var(--line)] bg-[var(--surface-2)] px-6 py-6 sm:px-8">
            <DepartmentTracker rows={rows} compact />
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/student/request" className="tile enter" style={{ ["--i" as string]: 2 }}>
          <span className="tile-icon"><IconSend size={22} /></span>
          <span>
            <strong className="block">Submit Clearance Request</strong>
            <span className="muted text-sm">Send your request to all departments at once</span>
          </span>
          <IconArrowRight size={18} className="tile-arrow" />
        </Link>
        <Link href="/status" className="tile enter" style={{ ["--i" as string]: 3 }}>
          <span className="tile-icon"><IconListCheck size={22} /></span>
          <span>
            <strong className="block">View Clearance Status</strong>
            <span className="muted text-sm">Each department&apos;s decision and remarks</span>
          </span>
          <IconArrowRight size={18} className="tile-arrow" />
        </Link>
      </div>
    </AppShell>
  );
}
