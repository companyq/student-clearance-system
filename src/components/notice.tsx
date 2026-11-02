import { IconAlert, IconCheckCircle, IconXCircle } from "./icons";

/** Web version of the desktop MessageBox: an icon + message that slides in. */
export function Notice({ kind, children }: { kind: "ok" | "warn" | "bad"; children: React.ReactNode }) {
  const Ico = kind === "ok" ? IconCheckCircle : kind === "warn" ? IconAlert : IconXCircle;
  return (
    <div className={`notice notice-${kind} mb-5`} role={kind === "ok" ? "status" : "alert"}>
      <Ico size={18} />
      <div>{children}</div>
    </div>
  );
}

/** Status label with a coloured dot: Pending / Approved / Rejected / Cleared. */
export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

/** Spinner shown inside a button while its action runs. */
export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

/** Friendly empty state for tables and lists. */
export function EmptyState({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="enter-scale flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-[var(--surface-3)] text-[var(--muted)]">{icon}</span>
      <p className="font-semibold">{title}</p>
      {children && <p className="muted mt-1 max-w-sm text-sm">{children}</p>}
    </div>
  );
}
