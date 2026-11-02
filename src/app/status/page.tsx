import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, requestRef } from "@/lib/format";
import { AppShell, PageHeader } from "@/components/app-shell";
import { EmptyState, Notice, StatusBadge } from "@/components/notice";
import { ProgressRing } from "@/components/visuals";
import { DepartmentTracker, type DeptStatus } from "@/components/department-tracker";
import { IconArrowLeft, IconInbox } from "@/components/icons";

export const metadata = { title: "Clearance Status" };

interface StatusRow extends DeptStatus {
  request_id: number;
  date_submitted: string;
  overall_status: string;
}

/**
 * Objective 3: a student's clearance status in every department (one row per
 * department, from D3). Students always see their own; the administrator can
 * open any student with /status?adm=24-1516.
 */
export default async function StatusPage({ searchParams }: { searchParams: Promise<{ adm?: string }> }) {
  const user = await requireRole("Student", "Admin");
  const sp = await searchParams;
  const admNo = user.role === "Student" ? user.admNo! : (sp.adm ?? "").trim();
  const backHref = user.role === "Student" ? "/student" : "/admin/students";
  const back = (
    <Link href={backHref} className="btn"><IconArrowLeft size={16} /> Back</Link>
  );

  if (!admNo) {
    return (
      <AppShell user={user}>
        <PageHeader title="Clearance Status" actions={back} />
        <Notice kind="warn">No student selected. Choose a student from the Students page.</Notice>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const [{ data: student }, { data, error }] = await Promise.all([
    supabase.from("tbl_students").select("full_name, course").eq("adm_no", admNo).maybeSingle(),
    supabase.rpc("get_clearance_status", { p_adm_no: admNo }),
  ]);
  const rows = (data ?? []) as StatusRow[];
  const first = rows[0];
  const approved = rows.filter((r) => r.status === "Approved").length;

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow={user.role === "Admin" ? "Student record" : "My clearance"}
        title="Clearance Status"
        subtitle={student ? `${student.full_name} · ${admNo} · ${student.course}` : admNo}
        actions={back}
      />

      {error && <Notice kind="bad">A database error occurred while loading the clearance status.</Notice>}
      {!student && !error && <Notice kind="warn">Student {admNo} was not found.</Notice>}

      {student && !first && (
        <div className="card enter">
          <EmptyState icon={<IconInbox size={26} />} title="No clearance request yet">
            {user.role === "Student" ? (
              <>Submit a request and each department&apos;s decision will appear here. <Link href="/student/request" className="font-semibold text-[var(--brand)] underline">Submit now</Link></>
            ) : "This student has not submitted a clearance request."}
          </EmptyState>
        </div>
      )}

      {first && (
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <aside className="card enter flex flex-col items-center text-center" style={{ ["--i" as string]: 1 }}>
            <ProgressRing done={approved} total={rows.length} size={150} />
            <div className="mt-5"><StatusBadge status={first.overall_status} /></div>
            <dl className="mt-6 w-full space-y-3 border-t border-[var(--line)] pt-5 text-left text-sm">
              <div className="flex justify-between gap-3"><dt className="muted">Reference</dt><dd className="font-semibold">{requestRef(first.request_id)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="muted">Submitted</dt><dd className="font-medium">{formatDateTime(first.date_submitted)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="muted">Departments</dt><dd className="font-medium">{rows.length}</dd></div>
            </dl>
          </aside>

          <section className="card enter" style={{ ["--i" as string]: 2 }}>
            <h2 className="card-title mb-6">Department decisions</h2>
            <DepartmentTracker rows={rows} />
          </section>
        </div>
      )}
    </AppShell>
  );
}
