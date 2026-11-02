# Student Clearance System — Setup guide

Next.js 16 + TypeScript + Tailwind CSS + Supabase (PostgreSQL), the same stack as Project Q.

## 1. Create a Supabase project (free)
1. Go to <https://supabase.com> → **New project**. Choose a name (e.g. `clearance-system`) and a database password.
2. Wait about 2 minutes for it to be ready.

## 2. Add your keys
1. Copy `.env.local.example` to `.env.local`.
2. In Supabase open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (secret — never share or commit it)

## 3. Create the database
Pick one:
- **SQL Editor (easiest):** Supabase → **SQL Editor → New query**, paste all of `supabase/schema.sql`, click **Run**.
- **Command line:** put the **Session pooler** connection string (Supabase → **Connect**) in `DATABASE_URL`, then run `npm run db:setup`.

This creates the five tables, the security rules, the database functions, the 4 departments and 3 sample students.

## 4. Create the logins
```bash
npm install
npm run seed
```

| Role | Username | Password |
|---|---|---|
| System Administrator | `admin` | `Admin@123` |
| Library / Finance / Accommodation / Administration officer | `lib.officer`, `fin.officer`, `acc.officer`, `adm.officer` | `Officer@123` |
| Students | `24-1516`, `24-1517`, `24-1518` | `Student@123` |

Change these passwords before any real use (Admin → Users & Departments).

## 5. Run it
```bash
npm run dev
```
Open <http://localhost:3000>.

## Deploying (optional)
Deploy to **Vercel** and add the same three `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
and `SUPABASE_SERVICE_ROLE_KEY` values under Project Settings → Environment Variables.
