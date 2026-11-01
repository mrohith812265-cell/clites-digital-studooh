-- Clites — project inquiry backend
-- Apply this migration in the Supabase SQL Editor or with the Supabase CLI.
--
-- Security model:
--   * Anonymous visitors may INSERT only the public form columns.
--   * Anonymous and authenticated browser users have no SELECT/UPDATE/DELETE.
--   * The status and created_at columns are forced server-side.
--   * No administrator policy is exposed to the public frontend.
--     Administrators review/update rows in the Supabase Dashboard (or through
--     a future server-side admin endpoint using the service-role key).

create table if not exists public.project_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  business_name text,
  project_type text,
  budget text,
  message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),

  constraint project_inquiries_name_length
    check (char_length(btrim(name)) between 1 and 120),
  constraint project_inquiries_email_length
    check (char_length(btrim(email)) between 3 and 254),
  constraint project_inquiries_email_format
    check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  constraint project_inquiries_business_name_length
    check (business_name is null or char_length(btrim(business_name)) <= 160),
  constraint project_inquiries_project_type_length
    check (project_type is null or char_length(btrim(project_type)) <= 80),
  constraint project_inquiries_budget_length
    check (budget is null or char_length(btrim(budget)) <= 80),
  constraint project_inquiries_message_length
    check (char_length(btrim(message)) between 10 and 5000),
  constraint project_inquiries_status_values
    check (status in ('pending', 'reviewed', 'contacted', 'closed'))
);

comment on table public.project_inquiries is
  'Project inquiries submitted from the Clites website. Public users can insert only.';
comment on column public.project_inquiries.status is
  'Administrator-managed workflow state; public inserts are forced to pending.';
comment on column public.project_inquiries.created_at is
  'Server-generated submission timestamp; public inserts cannot override it.';

create index if not exists project_inquiries_created_at_idx
  on public.project_inquiries (created_at desc);

create index if not exists project_inquiries_status_created_at_idx
  on public.project_inquiries (status, created_at desc);

-- Normalize whitespace and force server-owned values before validation.
create or replace function public.normalize_project_inquiry()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.name := btrim(new.name);
  new.email := lower(btrim(new.email));
  new.business_name := nullif(btrim(new.business_name), '');
  new.project_type := nullif(btrim(new.project_type), '');
  new.budget := nullif(btrim(new.budget), '');
  new.message := btrim(new.message);
  new.status := 'pending';
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists normalize_project_inquiry_before_insert
  on public.project_inquiries;

create trigger normalize_project_inquiry_before_insert
before insert on public.project_inquiries
for each row execute function public.normalize_project_inquiry();

alter table public.project_inquiries enable row level security;
alter table public.project_inquiries force row level security;

-- Remove browser-role table privileges, then grant only the public insert
-- columns. This prevents visitors from writing id, status, or created_at even
-- if they bypass the form.
grant usage on schema public to anon, authenticated;
revoke all on table public.project_inquiries from anon, authenticated;
grant insert (name, email, business_name, project_type, budget, message)
  on table public.project_inquiries to anon, authenticated;

drop policy if exists "Public can submit valid project inquiries"
  on public.project_inquiries;

create policy "Public can submit valid project inquiries"
on public.project_inquiries
for insert
to anon, authenticated
with check (
  status = 'pending'
  and char_length(btrim(name)) between 1 and 120
  and char_length(btrim(email)) between 3 and 254
  and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  and (business_name is null or char_length(btrim(business_name)) <= 160)
  and (project_type is null or char_length(btrim(project_type)) <= 80)
  and (budget is null or char_length(btrim(budget)) <= 80)
  and char_length(btrim(message)) between 10 and 5000
);

-- No SELECT, UPDATE, or DELETE policy is created for anon/authenticated.
-- Consequently RLS denies those operations even if a grant is added later.
-- Do not add public read/update policies to this table.
