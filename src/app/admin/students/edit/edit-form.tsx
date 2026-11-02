"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateStudent } from "./actions";
import type { ActionState } from "@/lib/action-state";
import { Notice, Spinner } from "@/components/notice";

export interface StudentRecord {
  adm_no: string;
  full_name: string;
  course: string;
  email: string | null;
  phone: string | null;
}

export default function EditForm({ student }: { student: StudentRecord }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateStudent, {});

  return (
    <form action={action}>
      {state.message && <Notice kind="ok">{state.message}</Notice>}
      {state.error && <Notice kind="warn">{state.error}</Notice>}

      <div className="grid gap-x-4 sm:grid-cols-[10rem_1fr]">
        <div className="field !mt-0">
          <label className="field-label" htmlFor="adm_no">Admission No</label>
          <input id="adm_no" name="adm_no" value={student.adm_no} readOnly className="input" />
        </div>
        <div className="field sm:!mt-0">
          <label className="field-label" htmlFor="full_name">Full Name *</label>
          <input id="full_name" name="full_name" defaultValue={student.full_name} required maxLength={100} className="input" />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="course">Course *</label>
        <input id="course" name="course" defaultValue={student.course} required maxLength={100} className="input" />
      </div>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <div className="field">
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" defaultValue={student.email ?? ""} maxLength={100} className="input" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="phone">Phone</label>
          <input id="phone" name="phone" defaultValue={student.phone ?? ""} maxLength={13} className="input" />
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn btn-brand">
          {pending ? <><Spinner /> Saving…</> : "Save changes"}
        </button>
        <Link href="/admin/students" className="btn">Cancel</Link>
      </div>
    </form>
  );
}
