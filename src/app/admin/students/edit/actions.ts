"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError } from "@/lib/format";
import type { ActionState } from "@/lib/action-state";
import { checkEmail, checkPhone, checkRequired, firstError } from "@/lib/validation";

/** Administrator maintains a student record in D1 (the admission number itself is not changed). */
export async function updateStudent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("Admin");
  const admNo = String(formData.get("adm_no") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const problem = firstError(
    checkRequired(fullName, "Full name"),
    checkRequired(course, "Course"),
    checkEmail(email),
    checkPhone(phone),
  );
  if (problem) return { error: problem };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_student", {
    p_adm_no: admNo,
    p_full_name: fullName,
    p_course: course,
    p_email: email,
    p_phone: phone,
  });
  if (error) return { error: friendlyDbError("save the student record", error) };

  revalidatePath("/admin/students");
  return { message: "Student record updated." };
}
