"use client";

import { useActionState, useState } from "react";
import { recordDecision } from "./actions";
import type { ActionState } from "@/lib/action-state";
import { EmptyState, Notice, Spinner, StatusBadge } from "@/components/notice";
import { IconCheckCircle, IconClipboardCheck, IconClose, IconXCircle } from "@/components/icons";

export interface QueueRow {
  status_id: number;
  adm_no: string;
  full_name: string;
  course: string;
  submitted: string; // already formatted on the server
  status: string;
  remarks: string | null;
}

/** The officer's work list plus the decision panel (web frmProcessClearance). */
export default function ProcessPanel({ rows, department }: { rows: QueueRow[]; department: string }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [decision, setDecision] = useState<"Approved" | "Rejected" | null>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await recordDecision(prev, formData);
    if (result.message) setSelectedId(null); // the row leaves the list after a decision
    setDecision(null);
    return result;
  }, {});
  const selected = rows.find((r) => r.status_id === selectedId) ?? null;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="min-w-0">
        {state.message && <Notice kind="ok">{state.message}</Notice>}
        {state.error && <Notice kind="warn">{state.error}</Notice>}

        <section className="card card-flush enter" style={{ ["--i" as string]: 2 }}>
          <div className="card-header">
            <h2 className="card-title">Requests for {department}</h2>
            <span className="muted text-sm">{rows.length} item{rows.length === 1 ? "" : "s"}</span>
          </div>
          {rows.length === 0 ? (
            <EmptyState icon={<IconCheckCircle size={26} />} title="Nothing waiting">
              No requests are waiting for your department right now.
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.status_id} className={`cursor-pointer ${r.status_id === selectedId ? "selected" : ""}`}
                      onClick={() => setSelectedId(r.status_id)}>
                      <td className="strong">
                        {r.full_name}
                        <span className="muted block text-xs font-normal">{r.adm_no}</span>
                      </td>
                      <td>{r.course}</td>
                      <td className="whitespace-nowrap">{r.submitted}</td>
                      <td>
                        <StatusBadge status={r.status} />
                        {r.remarks && <span className="muted mt-1 block max-w-[14rem] truncate text-xs" title={r.remarks}>{r.remarks}</span>}
                      </td>
                      <td className="text-right">
                        <button type="button" className={`btn btn-sm ${r.status_id === selectedId ? "btn-brand" : ""}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedId(r.status_id); }}>
                          {r.status_id === selectedId ? "Selected" : "Review"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Decision panel */}
      <aside className="xl:sticky xl:top-6">
        {selected ? (
          <form
            key={selected.status_id}
            action={action}
            className="card enter-scale"
            onSubmit={(e) => {
              // The clicked button's value ("Approved"/"Rejected") is sent with the form
              const choice = ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value;
              const verb = choice === "Approved" ? "Approve" : "Reject";
              if (!confirm(`${verb} clearance for ${selected.full_name} (${selected.adm_no})?`)) {
                e.preventDefault();
                return;
              }
              setDecision(choice === "Approved" ? "Approved" : "Rejected"); // which button shows the spinner
            }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Decision for</p>
                <p className="mt-1 text-lg font-bold leading-tight">{selected.full_name}</p>
                <p className="muted text-sm">{selected.adm_no} · {selected.course}</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm !px-2" onClick={() => setSelectedId(null)} aria-label="Close">
                <IconClose size={16} />
              </button>
            </div>

            <input type="hidden" name="status_id" value={selected.status_id} />
            <input type="hidden" name="student" value={`${selected.full_name} (${selected.adm_no})`} />

            <label className="field-label" htmlFor="remarks">
              Remarks <span className="hint">· required when rejecting</span>
            </label>
            <textarea id="remarks" name="remarks" maxLength={500} className="input" placeholder="e.g. Overdue library book: Introduction to MIS" />

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="submit" name="decision" value="Approved" disabled={pending} className="btn btn-ok">
                {pending && decision === "Approved" ? <Spinner /> : <IconCheckCircle size={18} />} Approve
              </button>
              <button type="submit" name="decision" value="Rejected" disabled={pending} className="btn btn-bad">
                {pending && decision === "Rejected" ? <Spinner /> : <IconXCircle size={18} />} Reject
              </button>
            </div>
          </form>
        ) : (
          <div className="card enter border-dashed text-center" style={{ ["--i" as string]: 3 }}>
            <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-[var(--surface-3)] text-[var(--muted)]">
              <IconClipboardCheck size={24} />
            </span>
            <p className="font-semibold">Select a request</p>
            <p className="muted mt-1 text-sm">Choose a student from the list to approve or reject their clearance.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
