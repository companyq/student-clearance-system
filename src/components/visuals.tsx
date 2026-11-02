"use client";

import { useEffect, useRef, useState } from "react";

/** A number that counts up from 0 when it first appears. */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || value === 0) {
      requestAnimationFrame(() => setShown(value));
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3)))); // ease-out
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{shown.toLocaleString("en-GB")}</>;
}

/** Circular progress meter that draws itself in (e.g. 3 of 4 departments approved). */
export function ProgressRing({ done, total, size = 132 }: { done: number; total: number; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const full = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const complete = total > 0 && done === total;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img"
        aria-label={`${done} of ${total} departments approved`}>
        {/* track: a lighter step of the same colour */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          stroke={complete ? "var(--good-soft)" : "var(--brand-soft)"} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={complete ? "var(--good)" : "var(--brand)"}
          strokeDasharray={full}
          strokeDashoffset={full * (1 - pct)}
          style={{ ["--ring-full" as string]: full, animation: "ring-draw 1.1s cubic-bezier(0.2,0.7,0.2,1) both" }}
        />
      </svg>
      <div className="absolute text-center leading-none">
        <div className="text-3xl font-bold tracking-tight">
          <CountUp value={done} />
          <span className="muted text-lg font-semibold">/{total}</span>
        </div>
        <div className="muted mt-1.5 text-[11px] font-semibold uppercase tracking-wider">approved</div>
      </div>
    </div>
  );
}

export interface DeptSummary {
  department: string;
  approved: number;
  pending: number;
  rejected: number;
}

const SERIES = [
  { key: "approved", label: "Approved", color: "var(--good)" },
  { key: "pending", label: "Pending", color: "var(--warn)" },
  { key: "rejected", label: "Rejected", color: "var(--bad)" },
] as const;

/**
 * Horizontal stacked bars: each department's items split into Approved /
 * Pending / Rejected. Legend above, total at the bar end, hover tooltip per
 * segment. The same numbers are in Reports -> Status by Department (table view).
 */
export function DepartmentBars({ data }: { data: DeptSummary[] }) {
  const [hover, setHover] = useState<{ dept: string; label: string; value: number; x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const max = Math.max(1, ...data.map((d) => d.approved + d.pending + d.rejected));

  return (
    <div className="relative" ref={box}>
      <ul className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[var(--ink-2)]">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>

      <div className="space-y-4">
        {data.map((d, row) => {
          const total = d.approved + d.pending + d.rejected;
          return (
            <div key={d.department} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-3 sm:grid-cols-[9rem_1fr_3rem]">
              <span className="truncate text-sm font-medium text-[var(--ink-2)]">{d.department}</span>
              <div className="relative h-7 rounded-md bg-[var(--surface-3)]">
                <div
                  className="flex h-full gap-[2px] overflow-hidden rounded-md"
                  style={{
                    width: `${(total / max) * 100}%`,
                    transformOrigin: "left",
                    animation: `grow-x 0.9s cubic-bezier(0.2,0.7,0.2,1) ${row * 90}ms both`,
                  }}
                >
                  {SERIES.map((s) => {
                    const value = d[s.key];
                    if (value === 0) return null;
                    return (
                      <div
                        key={s.key}
                        className="h-full cursor-default transition-opacity hover:opacity-80"
                        style={{ flexGrow: value, flexBasis: 0, background: s.color }}
                        onMouseMove={(e) => {
                          const r = box.current!.getBoundingClientRect();
                          setHover({ dept: d.department, label: s.label, value, x: e.clientX - r.left, y: e.clientY - r.top });
                        }}
                        onMouseLeave={() => setHover(null)}
                      />
                    );
                  })}
                </div>
              </div>
              <span className="text-right text-sm font-semibold tabular-nums text-[var(--ink)]">{total}</span>
            </div>
          );
        })}
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs shadow-lg"
          style={{ left: hover.x + 12, top: hover.y - 44 }}
        >
          <div className="font-semibold text-[var(--ink)]">{hover.dept}</div>
          <div className="text-[var(--ink-2)]">
            {hover.label}: <strong>{hover.value}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
