"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "./actions";
import type { ActionState } from "@/lib/action-state";
import { Notice, Spinner } from "@/components/notice";
import { IconArrowRight } from "@/components/icons";

export default function LoginForm({ username }: { username: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(signIn, {});

  return (
    <form action={action}>
      {state.error && <Notice kind="warn">{state.error}</Notice>}

      <div className="field">
        <label className="field-label" htmlFor="username">
          Username <span className="hint">· students use their admission number</span>
        </label>
        <input id="username" name="username" defaultValue={username} autoComplete="username" required maxLength={30}
          className="input" placeholder="e.g. 24-1516" autoFocus={!username} />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required
          className="input" placeholder="••••••••" autoFocus={Boolean(username)} />
      </div>

      <button type="submit" disabled={pending} className="btn btn-brand btn-lg mt-7 w-full">
        {pending ? <><Spinner /> Logging in…</> : <>Log in <IconArrowRight size={16} /></>}
      </button>

      <div className="mt-8 flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        New to the system?
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>
      <Link href="/register" className="btn mt-4 w-full">Register as a student</Link>
    </form>
  );
}
