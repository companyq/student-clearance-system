-- ============================================================================
--  Student Clearance Management System - Database schema (Supabase / PostgreSQL)
--  Daystar University, MIS 400A
-- ----------------------------------------------------------------------------
--  Run this ONCE in the Supabase SQL Editor (or with `npm run db:setup`).
--  Safe to re-run: every object is created with IF NOT EXISTS / OR REPLACE.
--
--  Level 0 DFD data stores:
--    D1 Student Records           -> tbl_students
--    D2 Clearance Requests        -> tbl_clearance_requests
--    D3 Clearance Status Records  -> tbl_clearance_status
--  Supporting tables              -> tbl_departments, tbl_users
--
--  Security model:
--    * Passwords live in Supabase Auth (auth.users), hashed with bcrypt.
--      tbl_users links each login to its role / department / admission no.
--    * Row-Level Security is ON for every table. Users can only READ rows
--      their role allows; nobody can write to the tables directly.
--    * Every change goes through a function below that checks the caller's
--      role first, so the rules hold no matter who calls the database.
-- ============================================================================


-- ---------------------------------------------------------------------------
--  TABLES
-- ---------------------------------------------------------------------------

-- Departments that must clear every student
create table if not exists public.tbl_departments (
  department_id   serial primary key,
  department_name text not null unique check (length(trim(department_name)) > 0)
);

-- D1 Student Records
create table if not exists public.tbl_students (
  student_id      serial primary key,
  adm_no          text not null unique check (adm_no ~ '^[0-9]{2}-[0-9]{4}$'),   -- e.g. 24-1516
  full_name       text not null check (length(trim(full_name)) > 0),
  course          text not null check (length(trim(course)) > 0),
  email           text,
  phone           text,
  date_registered timestamptz not null default now()
);

-- Login accounts for all three roles (1:1 with auth.users)
create table if not exists public.tbl_users (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  username      text not null unique,
  role          text not null check (role in ('Admin', 'Officer', 'Student')),
  department_id int references public.tbl_departments(department_id),   -- officers only
  adm_no        text references public.tbl_students(adm_no),            -- students only
  is_active     boolean not null default true,
  -- An officer must have a department; nobody else has one
  constraint officer_has_department check ((role = 'Officer') = (department_id is not null)),
  -- A student login must point at a student record; nobody else does
  constraint student_has_adm_no check ((role = 'Student') = (adm_no is not null))
);

-- D2 Clearance Requests (UNIQUE adm_no = one request per student)
create table if not exists public.tbl_clearance_requests (
  request_id     serial primary key,
  adm_no         text not null unique references public.tbl_students(adm_no),
  date_submitted timestamptz not null default now(),
  overall_status text not null default 'Pending'
                 check (overall_status in ('Pending', 'Rejected', 'Cleared'))
);

-- D3 Clearance Status Records (one row per request per department)
create table if not exists public.tbl_clearance_status (
  status_id     serial primary key,
  request_id    int not null references public.tbl_clearance_requests(request_id) on delete cascade,
  department_id int not null references public.tbl_departments(department_id),
  status        text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  remarks       text,
  officer_id    uuid references public.tbl_users(user_id),
  date_updated  timestamptz,
  unique (request_id, department_id),
  -- A rejection must always carry a reason
  constraint rejection_needs_reason check (status <> 'Rejected' or length(trim(coalesce(remarks, ''))) > 0)
);

create index if not exists clearance_status_department_idx on public.tbl_clearance_status (department_id, status);


-- ---------------------------------------------------------------------------
--  WHO IS CALLING?  (used by the security rules and functions below)
--  auth.uid() is the logged-in Supabase user. Inactive accounts get NULL,
--  which means every rule below denies them.
-- ---------------------------------------------------------------------------

create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as $$
  select role from tbl_users where user_id = auth.uid() and is_active
$$;

create or replace function public.app_department() returns int
language sql stable security definer set search_path = public as $$
  select department_id from tbl_users where user_id = auth.uid() and is_active
$$;

create or replace function public.app_adm_no() returns text
language sql stable security definer set search_path = public as $$
  select adm_no from tbl_users where user_id = auth.uid() and is_active
$$;

-- Stops the function if the caller does not have one of the allowed roles
create or replace function public.require_role(allowed text[]) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if coalesce(app_role(), '') <> all (allowed) then
    raise exception 'You are not allowed to do this.' using errcode = '42501';
  end if;
end $$;


-- ---------------------------------------------------------------------------
--  ROW-LEVEL SECURITY (read access per role; no direct writes for anyone)
-- ---------------------------------------------------------------------------

alter table public.tbl_departments        enable row level security;
alter table public.tbl_students           enable row level security;
alter table public.tbl_users              enable row level security;
alter table public.tbl_clearance_requests enable row level security;
alter table public.tbl_clearance_status   enable row level security;

-- Helpers for the rules below. They run as the table owner, so one table's rule
-- can look at another table without the two rules calling each other forever.
create or replace function public.officer_handles_request(p_request_id int) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tbl_clearance_status s
                  where s.request_id = p_request_id and s.department_id = app_department())
$$;

create or replace function public.officer_handles_student(p_adm_no text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tbl_clearance_requests r
                   join tbl_clearance_status s on s.request_id = r.request_id
                  where r.adm_no = p_adm_no and s.department_id = app_department())
$$;

create or replace function public.my_request_id() returns int
language sql stable security definer set search_path = public as $$
  select request_id from tbl_clearance_requests where adm_no = app_adm_no()
$$;

drop policy if exists departments_read on public.tbl_departments;
create policy departments_read on public.tbl_departments
  for select to authenticated using (app_role() is not null);

drop policy if exists students_read on public.tbl_students;
create policy students_read on public.tbl_students
  for select to authenticated using (
    app_role() = 'Admin'
    or adm_no = app_adm_no()
    -- officers may see students who have a request in their department
    or (app_role() = 'Officer' and officer_handles_student(adm_no))
  );

drop policy if exists users_read on public.tbl_users;
create policy users_read on public.tbl_users
  for select to authenticated using (user_id = auth.uid() or app_role() = 'Admin');

drop policy if exists requests_read on public.tbl_clearance_requests;
create policy requests_read on public.tbl_clearance_requests
  for select to authenticated using (
    app_role() = 'Admin'
    or adm_no = app_adm_no()
    or (app_role() = 'Officer' and officer_handles_request(request_id))
  );

drop policy if exists status_read on public.tbl_clearance_status;
create policy status_read on public.tbl_clearance_status
  for select to authenticated using (
    app_role() = 'Admin'
    or department_id = app_department()
    or request_id = my_request_id()
  );


-- ---------------------------------------------------------------------------
--  DFD 2.0  SUBMIT CLEARANCE REQUEST
--  Student -> request -> D2, plus one Pending row per department in D3.
--  Runs as one transaction: either everything is saved or nothing is.
-- ---------------------------------------------------------------------------

create or replace function public.submit_request()
returns table (request_id int, overall_status text)
language plpgsql security definer set search_path = public as $$
declare
  v_adm_no text := app_adm_no();
  v_request_id int;
begin
  perform require_role(array['Student']);

  if exists (select 1 from tbl_clearance_requests r where r.adm_no = v_adm_no) then
    raise exception 'You already have a clearance request on record.' using errcode = 'P0001';
  end if;

  insert into tbl_clearance_requests (adm_no) values (v_adm_no)
  returning tbl_clearance_requests.request_id into v_request_id;

  insert into tbl_clearance_status (request_id, department_id, status)
  select v_request_id, d.department_id, 'Pending' from tbl_departments d;

  return query select v_request_id, 'Pending'::text;
end $$;


-- ---------------------------------------------------------------------------
--  DFD 3.0  PROCESS CLEARANCE
--  Officer -> approval / rejection -> D3, then recalculates D2.overall_status.
-- ---------------------------------------------------------------------------

-- OverallStatus rule: any Rejected -> Rejected; all Approved -> Cleared; else Pending
create or replace function public.recalculate_overall_status(p_request_id int) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_overall text;
begin
  select case
           when count(*) filter (where s.status = 'Rejected') > 0 then 'Rejected'
           when count(*) filter (where s.status = 'Approved') = count(*) then 'Cleared'
           else 'Pending'
         end
    into v_overall
    from tbl_clearance_status s
   where s.request_id = p_request_id;

  update tbl_clearance_requests set overall_status = v_overall where request_id = p_request_id;
  return v_overall;
end $$;

-- Only callable from inside the functions above, never directly by a user
revoke all on function public.recalculate_overall_status(int) from public, anon, authenticated;

create or replace function public.process_clearance(p_status_id int, p_decision text, p_remarks text)
returns text    -- the request's new overall status
language plpgsql security definer set search_path = public as $$
declare
  v_request_id int;
begin
  perform require_role(array['Officer']);

  if p_decision not in ('Approved', 'Rejected') then
    raise exception 'Decision must be Approved or Rejected.' using errcode = 'P0001';
  end if;
  if p_decision = 'Rejected' and length(trim(coalesce(p_remarks, ''))) = 0 then
    raise exception 'A reason is required when rejecting.' using errcode = 'P0001';
  end if;

  -- The department check means an officer can never change another department's row
  update tbl_clearance_status
     set status = p_decision,
         remarks = nullif(trim(coalesce(p_remarks, '')), ''),
         officer_id = auth.uid(),
         date_updated = now()
   where status_id = p_status_id
     and department_id = app_department()
     and status in ('Pending', 'Rejected')
  returning request_id into v_request_id;

  if v_request_id is null then
    raise exception 'This item was already approved or does not belong to your department.' using errcode = 'P0001';
  end if;

  return recalculate_overall_status(v_request_id);
end $$;

-- An officer's work list: Pending items (and optionally Rejected ones) for their department only
create or replace function public.get_department_queue(p_include_rejected boolean)
returns table (status_id int, request_id int, adm_no text, full_name text, course text,
               date_submitted timestamptz, status text, remarks text)
language plpgsql stable security definer set search_path = public as $$
begin
  perform require_role(array['Officer']);
  return query
    select s.status_id, s.request_id, st.adm_no, st.full_name, st.course, r.date_submitted, s.status, s.remarks
      from tbl_clearance_status s
      join tbl_clearance_requests r on r.request_id = s.request_id
      join tbl_students st on st.adm_no = r.adm_no
     where s.department_id = app_department()
       and (s.status = 'Pending' or (p_include_rejected and s.status = 'Rejected'))
     order by r.date_submitted;
end $$;


-- ---------------------------------------------------------------------------
--  OBJECTIVE 3  TRACK STATUS ACROSS ALL DEPARTMENTS
--  A student always gets their own; an admin may ask for any student.
-- ---------------------------------------------------------------------------

create or replace function public.get_clearance_status(p_adm_no text)
returns table (request_id int, date_submitted timestamptz, overall_status text,
               department text, status text, remarks text, processed_by text, date_updated timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare
  v_adm_no text := p_adm_no;
begin
  perform require_role(array['Student', 'Admin']);
  if app_role() = 'Student' then v_adm_no := app_adm_no(); end if;

  return query
    select r.request_id, r.date_submitted, r.overall_status,
           d.department_name, s.status, s.remarks, u.username, s.date_updated
      from tbl_clearance_requests r
      join tbl_clearance_status s on s.request_id = r.request_id
      join tbl_departments d on d.department_id = s.department_id
      left join tbl_users u on u.user_id = s.officer_id
     where r.adm_no = v_adm_no
     order by d.department_id;
end $$;


-- ---------------------------------------------------------------------------
--  DFD 4.0  GENERATE REPORTS  (administrator only; reads D1, D2, D3)
-- ---------------------------------------------------------------------------

create or replace function public.report_cleared_students()
returns table ("Reference" text, "Adm No" text, "Full Name" text, "Course" text,
               "Submitted" timestamptz, "Date Cleared" timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform require_role(array['Admin']);
  return query
    select 'REQ-' || lpad(r.request_id::text, 4, '0'), st.adm_no, st.full_name, st.course, r.date_submitted,
           (select max(s.date_updated) from tbl_clearance_status s where s.request_id = r.request_id)
      from tbl_clearance_requests r
      join tbl_students st on st.adm_no = r.adm_no
     where r.overall_status = 'Cleared'
     order by st.adm_no;
end $$;

-- p_department_id = 0 means all departments
create or replace function public.report_pending_clearances(p_department_id int)
returns table ("Reference" text, "Adm No" text, "Full Name" text, "Course" text,
               "Department" text, "Submitted" timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform require_role(array['Admin']);
  return query
    select 'REQ-' || lpad(r.request_id::text, 4, '0'), st.adm_no, st.full_name, st.course,
           d.department_name, r.date_submitted
      from tbl_clearance_status s
      join tbl_clearance_requests r on r.request_id = s.request_id
      join tbl_students st on st.adm_no = r.adm_no
      join tbl_departments d on d.department_id = s.department_id
     where s.status = 'Pending' and (p_department_id = 0 or s.department_id = p_department_id)
     order by r.date_submitted, d.department_id;
end $$;

create or replace function public.report_status_summary()
returns table ("Department" text, "Pending" bigint, "Approved" bigint, "Rejected" bigint, "Total" bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  perform require_role(array['Admin']);
  return query
    select d.department_name,
           count(*) filter (where s.status = 'Pending'),
           count(*) filter (where s.status = 'Approved'),
           count(*) filter (where s.status = 'Rejected'),
           count(s.status_id)
      from tbl_departments d
      left join tbl_clearance_status s on s.department_id = d.department_id
     group by d.department_id, d.department_name
     order by d.department_id;
end $$;

create or replace function public.report_department_status(p_department_id int)
returns table ("Reference" text, "Adm No" text, "Full Name" text, "Status" text,
               "Remarks" text, "Processed By" text, "Date Updated" timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform require_role(array['Admin']);
  return query
    select 'REQ-' || lpad(r.request_id::text, 4, '0'), st.adm_no, st.full_name, s.status,
           s.remarks, u.username, s.date_updated
      from tbl_clearance_status s
      join tbl_clearance_requests r on r.request_id = s.request_id
      join tbl_students st on st.adm_no = r.adm_no
      left join tbl_users u on u.user_id = s.officer_id
     where s.department_id = p_department_id
     order by s.status, st.adm_no;
end $$;


-- ---------------------------------------------------------------------------
--  ADMINISTRATION  (student records and departments; user accounts are
--  created by the app's server with the service key, after an admin check)
-- ---------------------------------------------------------------------------

create or replace function public.update_student(p_adm_no text, p_full_name text, p_course text,
                                                 p_email text, p_phone text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_role(array['Admin']);
  update tbl_students
     set full_name = trim(p_full_name),
         course    = trim(p_course),
         email     = nullif(trim(coalesce(p_email, '')), ''),
         phone     = nullif(trim(coalesce(p_phone, '')), '')
   where adm_no = p_adm_no;
  if not found then
    raise exception 'Student % was not found.', p_adm_no using errcode = 'P0001';
  end if;
end $$;

-- A new department applies to requests submitted after it is added
create or replace function public.add_department(p_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_role(array['Admin']);
  insert into tbl_departments (department_name) values (trim(p_name));
exception when unique_violation then
  raise exception 'A department with that name already exists.' using errcode = 'P0001';
end $$;

create or replace function public.rename_department(p_department_id int, p_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_role(array['Admin']);
  update tbl_departments set department_name = trim(p_name) where department_id = p_department_id;
exception when unique_violation then
  raise exception 'A department with that name already exists.' using errcode = 'P0001';
end $$;


-- ---------------------------------------------------------------------------
--  PERMISSIONS: logged-in users may call the functions (each checks the role
--  itself); anonymous visitors may call none of them.
-- ---------------------------------------------------------------------------

revoke all on function public.submit_request() from public, anon;
revoke all on function public.process_clearance(int, text, text) from public, anon;
revoke all on function public.get_department_queue(boolean) from public, anon;
revoke all on function public.get_clearance_status(text) from public, anon;
revoke all on function public.report_cleared_students() from public, anon;
revoke all on function public.report_pending_clearances(int) from public, anon;
revoke all on function public.report_status_summary() from public, anon;
revoke all on function public.report_department_status(int) from public, anon;
revoke all on function public.update_student(text, text, text, text, text) from public, anon;
revoke all on function public.add_department(text) from public, anon;
revoke all on function public.rename_department(int, text) from public, anon;

grant execute on function public.submit_request() to authenticated;
grant execute on function public.process_clearance(int, text, text) to authenticated;
grant execute on function public.get_department_queue(boolean) to authenticated;
grant execute on function public.get_clearance_status(text) to authenticated;
grant execute on function public.report_cleared_students() to authenticated;
grant execute on function public.report_pending_clearances(int) to authenticated;
grant execute on function public.report_status_summary() to authenticated;
grant execute on function public.report_department_status(int) to authenticated;
grant execute on function public.update_student(text, text, text, text, text) to authenticated;
grant execute on function public.add_department(text) to authenticated;
grant execute on function public.rename_department(int, text) to authenticated;


-- ---------------------------------------------------------------------------
--  SEED DATA: departments and sample students.
--  Login accounts (1 admin, 1 officer per department, the 3 students) are
--  created by `npm run seed`, because passwords must go through Supabase Auth.
-- ---------------------------------------------------------------------------

insert into public.tbl_departments (department_name) values
  ('Library'), ('Finance'), ('Accommodation'), ('Administration')
on conflict (department_name) do nothing;

insert into public.tbl_students (adm_no, full_name, course, email, phone) values
  ('24-1516', 'Amina Wanjiru', 'BSc Management Information Systems', 'amina.wanjiru@example.com', '0712345678'),
  ('24-1517', 'Brian Otieno',  'BCom Accounting',                     'brian.otieno@example.com',  '0723456789'),
  ('24-1518', 'Grace Mutua',   'BA Communication',                    'grace.mutua@example.com',   '0734567890')
on conflict (adm_no) do nothing;
