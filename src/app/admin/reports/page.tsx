import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, looksLikeTimestamp } from "@/lib/format";
import { AppShell, PageHeader } from "@/components/app-shell";
import { EmptyState, Notice, StatusBadge } from "@/components/notice";
import { IconBuilding, IconChart, IconCheckCircle, IconClock, IconInbox } from "@/components/icons";
import ReportTools from "./report-tools";

export const metadata = { title: "Reports" };

type ReportType = "cleared" | "pending" | "bydept";

/**
 * DFD 4.0 Generate Reports (objective 5): Admin -> report request; reads D1, D2, D3.
 *   Cleared Students      - requests whose overall status is Cleared
 *   Pending Clearances    - department items still Pending (all departments or one)
 *   Status by Department  - "All departments": Pending/Approved/Rejected counts per department;
 *                           one department: every student's status there
 * The report is chosen with ?type=...&dept=..., so a report can be bookmarked.
 */
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; dept?: string; run?: string }>;
}) {
  const user = await requireRole("Admin");
  const sp = await searchParams;
  const type: ReportType = sp.type === "pending" || sp.type === "bydept" ? sp.type : "cleared";
  const deptId = Number.parseInt(sp.dept ?? "0", 10) || 0;

  const supabase = await createClient();
  const { data: departments } = await supabase
    .from("tbl_departments")
    .select("department_id, department_name")
    .order("department_id");
  const deptName = departments?.find((d) => d.department_id === deptId)?.department_name ?? "All departments";

  // Run the report only after "Generate" is pressed
  let title = "";
  let rows: Record<string, unknown>[] = [];
  let failed = false;
  if (sp.run === "1") {
    const result =
      type === "cleared"
        ? await supabase.rpc("report_cleared_students")
        : type === "pending"
          ? await supabase.rpc("report_pending_clearances", { p_department_id: deptId })
          : deptId === 0
            ? await supabase.rpc("report_status_summary")
            : await supabase.rpc("report_department_status", { p_department_id: deptId });

    title =
      type === "cleared"
        ? "Cleared Students"
        : type === "pending"
          ? `Pending Clearances - ${deptName}`
          : deptId === 0
            ? "Clearance Status Summary by Department"
            : `Clearance Status - ${deptName}`;
    failed = Boolean(result.error);
    rows = (result.data ?? []) as Record<string, unknown>[];
  }

  // Show dates as "02 Nov 2026, 14:30" on screen, in the CSV and on paper
  const display = rows.map((r) =>
    Object.fromEntries(
      Object.entries(r).map(([k, v]) => [k, v == null ? "" : looksLikeTimestamp(v) ? formatDateTime(v) : String(v)]),
    ),
  );
  const columns = display.length > 0 ? Object.keys(display[0]) : [];
  // The summary report's count columns are right-aligned
  const numeric = new Set(type === "bydept" && deptId === 0 ? ["Pending", "Approved", "Rejected", "Total"] : []);
  const generatedAt = formatDateTime(new Date().toISOString());

  const reportTypes = [
    { value: "cleared", label: "Cleared Students", text: "Every department has approved", icon: IconCheckCircle },
    { value: "pending", label: "Pending Clearances", text: "Items still waiting for a decision", icon: IconClock },
    { value: "bydept", label: "Status by Department", text: "Counts, or one department in detail", icon: IconBuilding },
  ];

  return (
    <AppShell user={user}>
      <div className="no-print">
        <PageHeader eyebrow="DFD 4.0" title="Reports" subtitle="Choose a report, then export it to CSV or print it." />
      </div>

      <form method="get" className="card enter no-print mb-6" style={{ ["--i" as string]: 1 }}>
        <input type="hidden" name="run" value="1" />
        <fieldset>
          <legend className="field-label">Report</legend>
          <div className="grid gap-3 md:grid-cols-3">
            {reportTypes.map(({ value, label, text, icon: Ico }) => (
              <label key={value} className="group relative flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] p-4 transition hover:border-[var(--muted)] has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand-soft)] has-[:checked]:shadow-[0_0_0_3px_var(--brand-ring)]">
                <input type="radio" name="type" value={value} defaultChecked={type === value} className="peer sr-only" />
                <span className="grid size-9 flex-none place-items-center rounded-lg bg-[var(--surface-3)] text-[var(--muted)] transition peer-checked:bg-[var(--brand)] peer-checked:text-[var(--brand-ink)]">
                  <Ico size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="muted block text-xs">{text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="min-w-56">
            <label className="field-label" htmlFor="dept">Department <span className="hint">· not used by Cleared Students</span></label>
            <select id="dept" name="dept" defaultValue={String(deptId)} className="input">
              <option value="0">All departments</option>
              {departments?.map((d) => (
                <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-brand"><IconChart size={18} /> Generate report</button>
        </div>
      </form>

      {failed && <Notice kind="bad">A database error occurred while generating the report.</Notice>}

      {sp.run === "1" && !failed && (
        <>
          {/* Heading that appears on the printed page */}
          <div className="print-only mb-4">
            <div>Daystar University - Student Clearance System</div>
            <h1 className="text-xl font-bold">{title}</h1>
            <div>Generated {generatedAt} by {user.username} · {display.length} row(s)</div>
          </div>

          <section className="card card-flush enter" style={{ ["--i" as string]: 2 }}>
            <div className="card-header no-print">
              <div>
                <h2 className="card-title">{title}</h2>
                <p className="muted text-xs">Generated {generatedAt} · {display.length} row(s)</p>
              </div>
              {display.length > 0 && <ReportTools title={title} columns={columns} rows={display} />}
            </div>
            {display.length === 0 ? (
              <EmptyState icon={<IconInbox size={26} />} title="No rows for this report">Nothing matches this report yet.</EmptyState>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>{columns.map((c) => <th key={c} className={numeric.has(c) ? "num" : undefined}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {display.map((r, i) => (
                      <tr key={i}>
                        {columns.map((c) => (
                          <td key={c} className={numeric.has(c) ? "num" : c === "Full Name" || c === "Department" ? "strong" : undefined}>
                            {c === "Status" && r[c] ? <StatusBadge status={r[c]} /> : r[c]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
