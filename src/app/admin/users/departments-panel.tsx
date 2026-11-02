"use client";

import { useActionState, useState } from "react";
import { addDepartment, renameDepartment } from "./actions";
import type { ActionState } from "@/lib/action-state";
import { Notice, Spinner } from "@/components/notice";
import { IconBuilding, IconEdit, IconPlus } from "@/components/icons";
import type { Department } from "./users-panel";

/** Departments list with Add and Rename (web frmManageUsers, Departments tab). */
export default function DepartmentsPanel({ departments }: { departments: Department[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  // Whichever button was pressed last decides the message shown
  const [state, setState] = useState<ActionState>({});
  const [, addAction, adding] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const r = await addDepartment(prev, fd);
    setState(r);
    if (r.message) setName("");
    return r;
  }, {});
  const [, renameAction, renaming] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const r = await renameDepartment(prev, fd);
    setState(r);
    if (r.message) {
      setName("");
      setSelectedId(null);
    }
    return r;
  }, {});

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
      <section className="card card-flush enter min-w-0" style={{ ["--i" as string]: 2 }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Departments</h2>
            <p className="muted text-xs">A new department is included in requests submitted after it is added.</p>
          </div>
        </div>
        <ul className="grid gap-3 p-5 sm:grid-cols-2">
          {departments.map((d) => (
            <li key={d.department_id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(d.department_id);
                  setName(d.department_name);
                }}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${d.department_id === selectedId ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-[0_0_0_3px_var(--brand-ring)]" : "border-[var(--line)] bg-[var(--surface)]"}`}
              >
                <span className="grid size-9 place-items-center rounded-lg bg-[var(--surface-3)] text-[var(--muted)]"><IconBuilding size={18} /></span>
                <span className="font-semibold">{d.department_name}</span>
                <span className="muted ml-auto text-xs">#{d.department_id}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <form className="card enter-scale">
        <p className="eyebrow">{selectedId ? "Rename department" : "Add a department"}</p>
        <div className="mt-3">
          {state.message && <Notice kind="ok">{state.message}</Notice>}
          {state.error && <Notice kind="warn">{state.error}</Notice>}
        </div>
        <input type="hidden" name="department_id" value={selectedId ?? ""} />
        <label className="field-label" htmlFor="department_name">Department name</label>
        <input id="department_name" name="department_name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} className="input" placeholder="e.g. Sports" />
        <div className="mt-5 grid gap-2">
          <button type="submit" formAction={addAction} disabled={adding} className="btn btn-brand">
            {adding ? <Spinner /> : <IconPlus size={16} />} Add as new department
          </button>
          <button type="submit" formAction={renameAction} disabled={renaming || selectedId === null} className="btn">
            {renaming ? <Spinner /> : <IconEdit size={16} />} Rename selected
          </button>
          {selectedId !== null && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSelectedId(null); setName(""); }}>Clear selection</button>
          )}
        </div>
      </form>
    </div>
  );
}
