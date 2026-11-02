"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerStudent } from "./actions";
import type { ActionState } from "@/lib/action-state";
import { Notice, Spinner } from "@/components/notice";

export default function RegisterForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(registerStudent, {});

  return (
    <form action={action}>
      {state.error && <Notice kind="warn">{state.error}</Notice>}

      <div className="grid gap-x-4 sm:grid-cols-[10rem_1fr]">
        <div className="field">
          <label className="field-label" htmlFor="adm_no">Admission No *</label>
          <input id="adm_no" name="adm_no" required maxLength={7} className="input" placeholder="24-1516" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="full_name">Full Name *</label>
          <input id="full_name" name="full_name" required maxLength={100} className="input" autoComplete="name" />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="course">Course *</label>
        <input id="course" name="course" required maxLength={100} className="input" placeholder="e.g. BSc Management Information Systems" />
      </div>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <div className="field">
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" maxLength={100} className="input" autoComplete="email" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="phone">Phone</label>
          <input id="phone" name="phone" maxLength={13} className="input" placeholder="0712345678" autoComplete="tel" />
        </div>
      </div>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <div className="field">
          <label className="field-label" htmlFor="password">Password * <span className="hint">· min 6</span></label>
          <input id="password" name="password" type="password" required autoComplete="new-password" className="input" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="confirm">Confirm Password *</label>
          <input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="input" />
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn btn-brand btn-lg flex-1">
          {pending ? <><Spinner /> Creating account…</> : "Register"}
        </button>
        <Link href="/login" className="btn btn-lg">Cancel</Link>
      </div>
      <p className="muted mt-6 text-center text-sm">
        Already registered? <Link href="/login" className="font-semibold text-[var(--brand)] hover:underline">Log in</Link>
      </p>
    </form>
  );
}
