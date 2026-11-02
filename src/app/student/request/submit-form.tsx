"use client";

import { useActionState } from "react";
import { submitRequest } from "./actions";
import type { ActionState } from "@/lib/action-state";
import { Notice, Spinner } from "@/components/notice";
import { IconSend } from "@/components/icons";

export default function SubmitForm() {
  const [state, action, pending] = useActionState<ActionState>(submitRequest, {});

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Submit your clearance request to all departments?")) e.preventDefault();
      }}
    >
      {state.error && <Notice kind="warn">{state.error}</Notice>}
      <p className="mb-4 text-[var(--ink-2)]">
        When you submit, each department receives your request and marks it <strong>Approved</strong> or{" "}
        <strong>Rejected</strong>. You can follow every decision on your status page.
      </p>
      <button type="submit" disabled={pending} className="btn btn-brand btn-lg">
        {pending ? <><Spinner /> Submitting…</> : <><IconSend size={18} /> Submit Request</>}
      </button>
    </form>
  );
}
