"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError } from "@/lib/format";
import type { ActionState } from "@/lib/action-state";

/**
 * DFD 3.0 Process Clearance: Officer -> approval / rejection -> D3.
 * The process_clearance() database function checks the officer's department,
 * saves the decision, and recalculates the overall status in D2.
 */
export async function recordDecision(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("Officer");
  const statusId = Number(formData.get("status_id"));
  const decision = String(formData.get("decision") ?? "");
  const remarks = String(formData.get("remarks") ?? "").trim();
  const student = String(formData.get("student") ?? "");

  if (!Number.isInteger(statusId) || statusId <= 0) return { error: "Please select a request first." };
  if (decision !== "Approved" && decision !== "Rejected") return { error: "Choose Approve or Reject." };
  if (decision === "Rejected" && !remarks) {
    return { error: "Please enter the reason for rejecting this request in Remarks." };
  }

  const supabase = await createClient();
  const { data: overall, error } = await supabase.rpc("process_clearance", {
    p_status_id: statusId,
    p_decision: decision,
    p_remarks: remarks,
  });
  if (error) return { error: friendlyDbError("save the decision", error) };

  revalidatePath("/officer/process");
  return {
    message: `Decision recorded: ${decision} by ${user.departmentName} for ${student}. ` +
      `Student's overall clearance status is now: ${overall}`,
  };
}
