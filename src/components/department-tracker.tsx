import { formatDateTime } from "@/lib/format";
import { IconCheckCircle, IconClock, IconXCircle } from "./icons";
import { StatusBadge } from "./notice";

export interface DeptStatus {
  department: string;
  status: string;
  remarks: string | null;
  processed_by: string | null;
  date_updated: string | null;
}

const LOOK: Record<string, { icon: React.ComponentType<{ size?: number }>; ring: string; fg: string }> = {
  Approved: { icon: IconCheckCircle, ring: "var(--good-soft)", fg: "var(--good-ink)" },
  Rejected: { icon: IconXCircle, ring: "var(--bad-soft)", fg: "var(--bad-ink)" },
  Pending: { icon: IconClock, ring: "var(--warn-soft)", fg: "var(--warn-ink)" },
};

/** Vertical timeline of a request's status in every department (objective 3). */
export function DepartmentTracker({ rows, compact = false }: { rows: DeptStatus[]; compact?: boolean }) {
  return (
    <ol className="relative">
      {rows.map((r, i) => {
        const look = LOOK[r.status] ?? LOOK.Pending;
        const Ico = look.icon;
        const last = i === rows.length - 1;
        return (
          <li key={r.department} className="enter relative flex gap-4 pb-6 last:pb-0" style={{ ["--i" as string]: i + 1 }}>
            {!last && <span className="absolute left-5 top-11 bottom-1 w-px bg-[var(--line-strong)]" aria-hidden="true" />}
            <span className="relative z-10 grid size-10 flex-none place-items-center rounded-full ring-4 ring-[var(--surface)]"
              style={{ background: look.ring, color: look.fg }}>
              <Ico size={20} />
            </span>
            <div className="min-w-0 flex-1 pt-1.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold">{r.department}</span>
                <StatusBadge status={r.status} />
              </div>
              {!compact && (
                <div className="muted mt-1 text-sm">
                  {r.date_updated
                    ? <>Updated {formatDateTime(r.date_updated)}{r.processed_by ? <> by <span className="font-medium text-[var(--ink-2)]">{r.processed_by}</span></> : null}</>
                    : "Waiting for the department to review"}
                </div>
              )}
              {r.remarks && (
                <p className={`mt-2 rounded-lg border px-3 py-2 text-sm ${r.status === "Rejected" ? "border-[color-mix(in_srgb,var(--bad)_30%,transparent)] bg-[var(--bad-soft)] text-[var(--bad-ink)]" : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-2)]"}`}>
                  {r.status === "Rejected" && <strong>Reason: </strong>}{r.remarks}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
