import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import ProcessPanel, { type QueueRow } from "./process-panel";

export const metadata = { title: "Process Clearance" };

/**
 * DFD 3.0 Process Clearance. The officer sees ONLY their own department's items.
 * /officer/process?rejected=1 also lists items they rejected, so they can
 * approve them once the student sorts out the issue.
 */
export default async function ProcessPage({ searchParams }: { searchParams: Promise<{ rejected?: string }> }) {
  const user = await requireRole("Officer");
  const showRejected = (await searchParams).rejected === "1";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_department_queue", { p_include_rejected: showRejected });

  const rows: QueueRow[] = ((data ?? []) as (Omit<QueueRow, "submitted"> & { date_submitted: string })[]).map((r) => ({
    status_id: r.status_id,
    adm_no: r.adm_no,
    full_name: r.full_name,
    course: r.course,
    submitted: formatDateTime(r.date_submitted),
    status: r.status,
    remarks: r.remarks,
  }));

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow="DFD 3.0"
        title="Process Clearance"
        subtitle={`${user.departmentName} department · select a request, then approve or reject it`}
      />

      {/* Segmented filter: pending only, or pending + items I rejected */}
      <div className="enter mb-5 inline-flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-sm" style={{ ["--i" as string]: 1 }}>
        <Link href="/officer/process" aria-current={!showRejected ? "page" : undefined}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${!showRejected ? "bg-[var(--brand)] text-[var(--brand-ink)] shadow" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}>
          Pending
        </Link>
        <Link href="/officer/process?rejected=1" aria-current={showRejected ? "page" : undefined}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${showRejected ? "bg-[var(--brand)] text-[var(--brand-ink)] shadow" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}>
          Pending + items I rejected
        </Link>
      </div>

      {error && <Notice kind="bad">A database error occurred while loading the clearance requests.</Notice>}
      <ProcessPanel rows={rows} department={user.departmentName ?? ""} />
    </AppShell>
  );
}
