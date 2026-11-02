import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { AppShell, PageHeader } from "@/components/app-shell";
import { EmptyState, Notice } from "@/components/notice";
import { IconEdit, IconEye, IconSearch } from "@/components/icons";

export const metadata = { title: "Search Students" };

/** Makes %, _ and \ in the search box match literally instead of acting as wildcards. */
function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Objective 4: search student records by admission number (starts with) or
 * name (contains). The search runs on the server with the values passed as
 * query parameters, never pasted into SQL.
 */
export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ by?: string; q?: string }> }) {
  const user = await requireRole("Admin");
  const sp = await searchParams;
  const byName = sp.by === "name";
  const term = (sp.q ?? "").trim().slice(0, 100);

  const supabase = await createClient();
  let query = supabase
    .from("tbl_students")
    .select("adm_no, full_name, course, email, phone, date_registered")
    .order(byName ? "full_name" : "adm_no");
  if (term) {
    query = byName
      ? query.ilike("full_name", `%${escapeLike(term)}%`)
      : query.ilike("adm_no", `${escapeLike(term)}%`);
  }
  const { data: students, error } = await query;

  return (
    <AppShell user={user}>
      <PageHeader eyebrow="Objective 4" title="Student Records" subtitle="Search by admission number or name, then edit a record or open its clearance status." />

      <form className="card enter mb-6 flex flex-wrap items-center gap-3 !p-4" method="get" style={{ ["--i" as string]: 1 }}>
        <select name="by" defaultValue={byName ? "name" : "adm"} className="input !w-44" aria-label="Search by">
          <option value="adm">Admission No</option>
          <option value="name">Name</option>
        </select>
        <div className="relative min-w-56 flex-1">
          <IconSearch size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input name="q" defaultValue={term} placeholder="e.g. 24-15 or Otieno (leave empty to list all)" className="input !pl-10" aria-label="Search for" />
        </div>
        <button type="submit" className="btn btn-brand">Search</button>
      </form>

      {error && <Notice kind="bad">A database error occurred while searching student records.</Notice>}

      <section className="card card-flush enter" style={{ ["--i" as string]: 2 }}>
        <div className="card-header">
          <h2 className="card-title">{term ? `Results for “${term}”` : "All students"}</h2>
          <span className="muted text-sm">{students?.length ?? 0} student(s) found</span>
        </div>
        {(students?.length ?? 0) === 0 ? (
          <EmptyState icon={<IconSearch size={26} />} title="No students found">Try a different admission number or name.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Contact</th>
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students?.map((s) => (
                  <tr key={s.adm_no}>
                    <td className="strong">
                      {s.full_name}
                      <span className="muted block text-xs font-normal">{s.adm_no}</span>
                    </td>
                    <td>{s.course}</td>
                    <td className="text-sm">
                      {s.email && <span className="block">{s.email}</span>}
                      {s.phone && <span className="muted block">{s.phone}</span>}
                    </td>
                    <td className="whitespace-nowrap">{formatDate(s.date_registered)}</td>
                    <td className="whitespace-nowrap text-right">
                      <Link href={`/admin/students/edit?adm=${encodeURIComponent(s.adm_no)}`} className="btn btn-sm btn-ghost"><IconEdit size={15} /> Edit</Link>
                      <Link href={`/status?adm=${encodeURIComponent(s.adm_no)}`} className="btn btn-sm"><IconEye size={15} /> Status</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
