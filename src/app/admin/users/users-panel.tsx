"use client";

import { useActionState, useState } from "react";
import { saveUser } from "./actions";
import type { ActionState } from "@/lib/action-state";
import { Notice, Spinner } from "@/components/notice";
import { IconGraduation, IconPlus } from "@/components/icons";

export interface UserRow {
  user_id: string;
  username: string;
  role: "Admin" | "Officer" | "Student";
  department_id: number | null;
  department: string | null;
  adm_no: string | null;
  is_active: boolean;
}

export interface Department {
  department_id: number;
  department_name: string;
}

/** User accounts list plus the add / edit form (web frmManageUsers, Users tab). */
export default function UsersPanel({ users, departments, myUserId }: { users: UserRow[]; departments: Department[]; myUserId: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await saveUser(prev, formData);
    if (result.message) setSelectedId(null); // back to "new user" after saving
    return result;
  }, {});
  const selected = users.find((u) => u.user_id === selectedId) ?? null;
  const [role, setRole] = useState<string>("Officer");

  function select(u: UserRow | null) {
    setSelectedId(u?.user_id ?? null);
    setRole(u?.role ?? "Officer");
  }

  const isStudent = selected?.role === "Student";
  const isMe = selected?.user_id === myUserId;

  const roleBadge: Record<string, string> = {
    Admin: "bg-[var(--brand-soft)] text-[var(--brand)]",
    Officer: "bg-[var(--surface-3)] text-[var(--ink-2)]",
    Student: "bg-[var(--surface-3)] text-[var(--muted)]",
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
      <section className="card card-flush enter min-w-0" style={{ ["--i" as string]: 1 }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">User accounts</h2>
            <p className="muted text-xs">Select a user to edit. Students create their own accounts by registering.</p>
          </div>
          <span className="muted text-sm">{users.length} accounts</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className={`cursor-pointer ${u.user_id === selectedId ? "selected" : ""}`} onClick={() => select(u)}>
                  <td className="strong">
                    <span className="flex items-center gap-3">
                      <span className="avatar !size-8 !text-[11px]">{u.role === "Student" ? <IconGraduation size={15} /> : u.username.slice(0, 2).toUpperCase()}</span>
                      <span>
                        {u.username}
                        {u.adm_no && <span className="muted block text-xs font-normal">Student {u.adm_no}</span>}
                        {u.user_id === myUserId && <span className="muted block text-xs font-normal">You</span>}
                      </span>
                    </span>
                  </td>
                  <td><span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${roleBadge[u.role]}`}>{u.role}</span></td>
                  <td>{u.department ?? <span className="muted">-</span>}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.is_active ? "text-[var(--good-ink)]" : "text-[var(--muted)]"}`}>
                      <span className={`size-1.5 rounded-full ${u.is_active ? "bg-[var(--good)]" : "bg-[var(--line-strong)]"}`} />
                      {u.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* key resets the form fields whenever a different user is selected */}
      <form action={action} key={selectedId ?? "new"} className="card enter-scale xl:sticky xl:top-6">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{selected ? "Edit user" : "Add a user"}</p>
            <p className="mt-1 text-lg font-bold">{selected ? selected.username : "New staff account"}</p>
          </div>
          {selected && (
            <button type="button" className="btn btn-sm" onClick={() => select(null)}><IconPlus size={14} /> New</button>
          )}
        </div>
        {state.message && <Notice kind="ok">{state.message}</Notice>}
        {state.error && <Notice kind="warn">{state.error}</Notice>}
        <input type="hidden" name="user_id" value={selected?.user_id ?? ""} />

        <div className="field">
          <label className="field-label" htmlFor="username">Username *</label>
          <input id="username" name="username" defaultValue={selected?.username ?? ""} readOnly={Boolean(selected)} required maxLength={30} className="input" placeholder="e.g. lib.officer2" />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="password">
            Password <span className="hint">· {selected ? "blank keeps the current one" : "min 6 characters"}</span>
          </label>
          <input id="password" name="password" type="password" autoComplete="new-password" className="input" />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="role">Role *</label>
          <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value)} disabled={isStudent || isMe} className="input">
            <option value="Admin">Admin</option>
            <option value="Officer">Officer</option>
            {isStudent && <option value="Student">Student</option>}
          </select>
          {/* disabled fields are not sent, so send the fixed role separately */}
          {(isStudent || isMe) && <input type="hidden" name="role" value={role} />}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="department_id">Department <span className="hint">· officers only</span></label>
          <select id="department_id" name="department_id" defaultValue={selected?.department_id ?? ""} disabled={role !== "Officer"} className="input">
            <option value="">(none)</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
            ))}
          </select>
        </div>

        <label className="mt-5 flex items-center gap-2.5 text-sm font-medium">
          <input type="checkbox" name="is_active" defaultChecked={selected?.is_active ?? true} disabled={isMe || !selected} className="checkbox" />
          Account active
        </label>
        {(isMe || !selected) && <input type="hidden" name="is_active" value="on" />}

        <button type="submit" disabled={pending} className="btn btn-brand mt-6 w-full">
          {pending ? <><Spinner /> Saving…</> : selected ? "Save changes" : <><IconPlus size={16} /> Add user</>}
        </button>
      </form>
    </div>
  );
}
