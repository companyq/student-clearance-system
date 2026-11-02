# Student Clearance Management System

Daystar University · MIS 400A. Students register and submit one clearance request; officers in
Library, Finance, Accommodation and Administration approve or reject it for their own department;
the administrator manages records, users and departments and generates reports.

Setup: see **[SETUP.md](SETUP.md)**.

## Stack
- **Next.js 16** (App Router, React 19, TypeScript), **Tailwind CSS v4**
- **Supabase**: PostgreSQL database, Row-Level Security, Auth (passwords hashed with bcrypt)

## How the code maps to the Level 0 DFD
| DFD process | Page | Where the work happens |
|---|---|---|
| 1.0 Register Student | `/register` | `src/app/register/actions.ts` → D1 `tbl_students` + login |
| 2.0 Submit Clearance Request | `/student/request` | `submit_request()` in `supabase/schema.sql` → D2 + one Pending row per department in D3 |
| 3.0 Process Clearance | `/officer/process` | `process_clearance()` → updates D3, then `recalculate_overall_status()` updates D2 |
| 4.0 Generate Reports | `/admin/reports` | `report_*()` functions read D1, D2, D3 |

| Data store | Table |
|---|---|
| D1 Student Records | `tbl_students` |
| D2 Clearance Requests | `tbl_clearance_requests` |
| D3 Clearance Status Records | `tbl_clearance_status` |
| Supporting | `tbl_departments`, `tbl_users` |

**Overall status rule:** any department Rejected → `Rejected`; every department Approved → `Cleared`; otherwise `Pending`.

## Security
- **Login:** Supabase Auth checks passwords, which are stored as bcrypt hashes and never in plain text.
  Usernames, including admission numbers for students, map to internal login emails (`src/lib/auth.ts`).
- **Access levels:**
  - Every page calls `requireRole(...)`.
  - The database also enforces roles. Row-Level Security limits what each role can read, and every
    write goes through a function that checks the caller's role first.
- **Officers** can only see and change their own department's rows. The database checks this; it isn't only hidden in the screens.
- **Queries:** all values are passed as parameters and never concatenated into SQL.
- **Validation:** `src/lib/validation.ts` checks required fields and the admission number format (`24-1516`).
  The database also enforces one request per student, no duplicate admission numbers, and a reason for every rejection.

## Project layout
```
src/app/
  login/ register/              objective 6, DFD 1.0
  student/ student/request/     student dashboard, DFD 2.0
  status/                       objective 3 (students: own; admin: ?adm=)
  officer/ officer/process/     officer dashboard, DFD 3.0
  admin/ admin/students/        objective 4 (search) + edit records
  admin/reports/                DFD 4.0 (CSV export, print)
  admin/users/                  user accounts and departments
src/lib/                        auth, validation, formatting, Supabase clients
supabase/schema.sql             tables, security rules, functions, seed data
scripts/                        db-setup and seed
```
