"use client";

import { IconDownload, IconPrinter } from "@/components/icons";

/**
 * Quotes a CSV value if it contains a comma, quote or line break. Values starting
 * with = + - @ get a leading apostrophe so Excel treats them as text, not formulas.
 */
function csvField(value: string): string {
  let v = value;
  if (v.length > 0 && "=+-@".includes(v[0])) v = `'${v}`;
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Export to CSV (opens in Excel) and Print / Print Preview for the current report. */
export default function ReportTools({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: Record<string, string>[];
}) {
  function exportCsv() {
    const lines = [columns.map(csvField).join(","), ...rows.map((r) => columns.map((c) => csvField(r[c] ?? "")).join(","))];
    // UTF-8 byte-order mark so Excel shows characters correctly
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]+/g, "_")}_${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button type="button" className="btn btn-sm" onClick={exportCsv}><IconDownload size={16} /> Export CSV</button>
      {/* The browser's print dialog includes a print preview */}
      <button type="button" className="btn btn-sm" onClick={() => window.print()}><IconPrinter size={16} /> Print</button>
    </div>
  );
}
