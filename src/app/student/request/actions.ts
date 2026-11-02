"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError } from "@/lib/format";
import type { ActionState } from "@/lib/action-state";

/**
 * DFD 2.0 Submit Clearance Request. The submit_request() database function
 * saves the request in D2 and one Pending row per department in D3 in a single
 * transaction, and refuses a second request. The page then shows the
 * reference and status (?submitted=1 adds the success message).
 */
export async function submitRequest(): Promise<ActionState> {
  await requireRole("Student");
  const supabase = await createClient();

  const { error } = await supabase.rpc("submit_request");
  if (error) return { error: friendlyDbError("submit the clearance request", error) };

  revalidatePath("/student");
  redirect("/student/request?submitted=1");
}
