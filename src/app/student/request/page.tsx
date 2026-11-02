import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requestRef } from "@/lib/format";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Notice, StatusBadge } from "@/components/notice";
import { IconArrowRight, IconBuilding, IconCheckCircle } from "@/components/icons";
import SubmitForm from "./submit-form";

export const metadata = { title: "Submit Clearance Request" };

/** DFD 2.0 Submit Clearance Request. */
export default async function SubmitRequestPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const user = await requireRole("Student");
  const justSubmitted = (await searchParams).submitted === "1";
  const supabase = await createClient();

  const [{ data: student }, { data: departments }, { data: existing }] = await Promise.all([
    supabase.from("tbl_students").select("adm_no, full_name, course").eq("adm_no", user.admNo!).maybeSingle(),
    supabase.from("tbl_departments").select("department_id, department_name").order("department_id"),
    supabase.from("tbl_clearance_requests").select("request_id, overall_status").eq("adm_no", user.admNo!).maybeSingle(),
  ]);

  return (
    <AppShell user={user}>
      <PageHeader eyebrow="DFD 2.0" title="Submit Clearance Request" subtitle="One request is reviewed by every department." />

      {justSubmitted && existing && (
        <Notice kind="ok">
          <strong>Clearance request submitted.</strong> Reference: {requestRef(existing.request_id)} · Status: {existing.overall_status}
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card enter" style={{ ["--i" as string]: 1 }}>
          <p className="eyebrow">Your details</p>
          {student && (
            <dl className="mt-3 grid gap-4 sm:grid-cols-3">
              <div><dt className="muted text-xs">Full name</dt><dd className="mt-0.5 font-semibold">{student.full_name}</dd></div>
              <div><dt className="muted text-xs">Admission No</dt><dd className="mt-0.5 font-semibold">{student.adm_no}</dd></div>
              <div><dt className="muted text-xs">Course</dt><dd className="mt-0.5 font-semibold">{student.course}</dd></div>
            </dl>
          )}

          <div className="mt-6 border-t border-[var(--line)] pt-6">
            {/* Only one request per student: show the existing one instead of the button */}
            {existing ? (
              <div className="flex flex-wrap items-center gap-4 rounded-xl bg-[var(--surface-2)] p-4">
                <span className="grid size-11 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><IconCheckCircle size={22} /></span>
                <div className="flex-1">
                  <p className="font-semibold">You already have a clearance request</p>
                  <p className="muted mt-0.5 text-sm">
                    Reference <strong className="text-[var(--ink)]">{requestRef(existing.request_id)}</strong> · <StatusBadge status={existing.overall_status} />
                  </p>
                </div>
                <Link href="/status" className="btn">View status <IconArrowRight size={16} /></Link>
              </div>
            ) : (
              <SubmitForm />
            )}
          </div>
        </section>

        <aside className="card enter" style={{ ["--i" as string]: 2 }}>
          <p className="eyebrow">Departments that will review it</p>
          <ul className="mt-4 space-y-2">
            {departments?.map((d, i) => (
              <li key={d.department_id} className="enter flex items-center gap-3 rounded-lg border border-[var(--line)] px-3 py-2.5" style={{ ["--i" as string]: i + 3 }}>
                <span className="grid size-8 place-items-center rounded-lg bg-[var(--surface-3)] text-[var(--muted)]"><IconBuilding size={16} /></span>
                <span className="font-medium">{d.department_name}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
