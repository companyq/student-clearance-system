import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import { IconArrowLeft } from "@/components/icons";
import EditForm from "./edit-form";

export const metadata = { title: "Edit Student Record" };

/** Administrator edits a student record: /admin/students/edit?adm=24-1516 */
export default async function EditStudentPage({ searchParams }: { searchParams: Promise<{ adm?: string }> }) {
  const user = await requireRole("Admin");
  const admNo = ((await searchParams).adm ?? "").trim();

  const supabase = await createClient();
  const { data: student } = admNo
    ? await supabase.from("tbl_students").select("adm_no, full_name, course, email, phone").eq("adm_no", admNo).maybeSingle()
    : { data: null };

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow="Student records"
        title="Edit student record"
        subtitle="The admission number cannot be changed."
        actions={<Link href="/admin/students" className="btn"><IconArrowLeft size={16} /> Back to search</Link>}
      />
      <div className="card enter max-w-2xl" style={{ ["--i" as string]: 1 }}>
        {student ? <EditForm student={student} /> : <Notice kind="warn">Student {admNo || "(none)"} was not found.</Notice>}
      </div>
    </AppShell>
  );
}
