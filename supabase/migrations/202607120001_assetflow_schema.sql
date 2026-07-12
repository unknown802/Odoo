create extension if not exists pgcrypto;

do $$
begin
  create type public.profile_role as enum ('Admin', 'Asset_Manager', 'Department_Head', 'Employee');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text unique not null,
  role public.profile_role not null default 'Employee',
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.departments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  head_id uuid references public.profiles,
  parent_department_id uuid references public.departments,
  status text default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz default now()
);

alter table public.profiles
  add column if not exists department_id uuid references public.departments;

create table if not exists public.asset_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  custom_fields jsonb default '{}',
  status text default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz default now()
);

create sequence if not exists public.asset_tag_seq start 1;

create table if not exists public.assets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category_id uuid references public.asset_categories not null,
  asset_tag text unique,
  serial_number text,
  acquisition_date date,
  acquisition_cost numeric(12, 2),
  condition text check (condition in ('New', 'Good', 'Fair', 'Poor', 'Damaged')),
  location text,
  status text default 'Available' check (status in ('Available', 'Allocated', 'Reserved', 'Under_Maintenance', 'Lost', 'Retired', 'Disposed')),
  is_bookable boolean default false,
  current_holder_id uuid references public.profiles,
  current_department_id uuid references public.departments,
  photos text[] default '{}',
  documents text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.asset_allocations (
  id uuid default gen_random_uuid() primary key,
  asset_id uuid references public.assets on delete cascade not null,
  allocated_to_id uuid references public.profiles,
  allocated_to_department_id uuid references public.departments,
  allocated_by_id uuid references public.profiles not null,
  allocated_at timestamptz default now(),
  expected_return_date date,
  returned_at timestamptz,
  return_condition text check (return_condition is null or return_condition in ('New', 'Good', 'Fair', 'Poor', 'Damaged')),
  return_notes text,
  status text default 'Active' check (status in ('Active', 'Returned', 'Overdue', 'Transferred')),
  created_at timestamptz default now()
);

create table if not exists public.transfer_requests (
  id uuid default gen_random_uuid() primary key,
  asset_id uuid references public.assets on delete cascade not null,
  from_holder_id uuid references public.profiles,
  to_holder_id uuid references public.profiles,
  requested_by_id uuid references public.profiles not null,
  approved_by_id uuid references public.profiles,
  status text default 'Requested' check (status in ('Requested', 'Approved', 'Rejected', 'Completed')),
  requested_at timestamptz default now(),
  approved_at timestamptz,
  completed_at timestamptz,
  notes text
);

create table if not exists public.resource_bookings (
  id uuid default gen_random_uuid() primary key,
  resource_id uuid references public.assets on delete cascade not null,
  booked_by_id uuid references public.profiles not null,
  department_id uuid references public.departments,
  start_time timestamptz not null,
  end_time timestamptz not null,
  purpose text,
  status text default 'Upcoming' check (status in ('Upcoming', 'Ongoing', 'Completed', 'Cancelled')),
  created_at timestamptz default now(),
  constraint booking_time_valid check (end_time > start_time)
);

create table if not exists public.maintenance_requests (
  id uuid default gen_random_uuid() primary key,
  asset_id uuid references public.assets on delete cascade not null,
  requested_by_id uuid references public.profiles not null,
  approved_by_id uuid references public.profiles,
  technician_id uuid references public.profiles,
  title text not null,
  description text,
  priority text check (priority in ('Low', 'Medium', 'High', 'Critical')),
  photos text[] default '{}',
  status text default 'Pending' check (status in ('Pending', 'Approved', 'Rejected', 'In_Progress', 'Resolved')),
  requested_at timestamptz default now(),
  approved_at timestamptz,
  started_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  cost numeric(12, 2)
);

create table if not exists public.audit_cycles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  scope_department_id uuid references public.departments,
  scope_location text,
  start_date date not null,
  end_date date,
  status text default 'Open' check (status in ('Open', 'In_Progress', 'Closed')),
  created_by_id uuid references public.profiles not null,
  created_at timestamptz default now()
);

create table if not exists public.audit_assignments (
  id uuid default gen_random_uuid() primary key,
  audit_cycle_id uuid references public.audit_cycles on delete cascade not null,
  auditor_id uuid references public.profiles not null,
  assigned_at timestamptz default now(),
  unique (audit_cycle_id, auditor_id)
);

create table if not exists public.audit_items (
  id uuid default gen_random_uuid() primary key,
  audit_cycle_id uuid references public.audit_cycles on delete cascade not null,
  asset_id uuid references public.assets on delete cascade not null,
  auditor_id uuid references public.profiles,
  status text default 'Pending' check (status in ('Pending', 'Verified', 'Missing', 'Damaged')),
  notes text,
  verified_at timestamptz,
  created_at timestamptz default now(),
  unique (audit_cycle_id, asset_id)
);

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  type text not null,
  title text not null,
  message text,
  data jsonb default '{}',
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb default '{}',
  ip_address text,
  created_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_assets_updated_at on public.assets;
create trigger trg_assets_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();

create or replace function public.generate_asset_tag()
returns trigger as $$
begin
  if new.asset_tag is null or length(trim(new.asset_tag)) = 0 then
    new.asset_tag := 'AF-' || lpad(nextval('public.asset_tag_seq')::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_generate_asset_tag on public.assets;
create trigger trg_generate_asset_tag
  before insert on public.assets
  for each row execute function public.generate_asset_tag();

create or replace function public.update_asset_on_allocation()
returns trigger as $$
begin
  if new.status = 'Active' then
    update public.assets
      set status = 'Allocated',
          current_holder_id = new.allocated_to_id,
          current_department_id = new.allocated_to_department_id
      where id = new.asset_id;
  elsif new.status in ('Returned', 'Transferred') then
    update public.assets
      set status = 'Available',
          current_holder_id = null,
          current_department_id = null
      where id = new.asset_id
        and not exists (
          select 1 from public.asset_allocations
          where asset_id = new.asset_id and status = 'Active' and id <> new.id
        );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_allocation_status on public.asset_allocations;
create trigger trg_allocation_status
  after insert or update on public.asset_allocations
  for each row execute function public.update_asset_on_allocation();

create or replace function public.flag_overdue_allocations()
returns void as $$
begin
  update public.asset_allocations
  set status = 'Overdue'
  where status = 'Active'
    and expected_return_date < current_date;
end;
$$ language plpgsql security definer;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'Employee'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create index if not exists idx_assets_status on public.assets(status);
create index if not exists idx_assets_tag on public.assets(asset_tag);
create index if not exists idx_assets_category on public.assets(category_id);
create index if not exists idx_allocations_asset on public.asset_allocations(asset_id);
create index if not exists idx_allocations_status on public.asset_allocations(status);
create index if not exists idx_allocations_expected_return on public.asset_allocations(expected_return_date);
create index if not exists idx_bookings_resource_time on public.resource_bookings(resource_id, start_time, end_time);
create index if not exists idx_maintenance_asset on public.maintenance_requests(asset_id);
create index if not exists idx_notifications_user on public.notifications(user_id, is_read);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);

alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.asset_categories enable row level security;
alter table public.assets enable row level security;
alter table public.asset_allocations enable row level security;
alter table public.transfer_requests enable row level security;
alter table public.resource_bookings enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.audit_cycles enable row level security;
alter table public.audit_assignments enable row level security;
alter table public.audit_items enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;

create or replace function public.current_user_role()
returns public.profile_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function public.is_manager()
returns boolean as $$
  select coalesce(public.current_user_role() in ('Admin', 'Asset_Manager'), false);
$$ language sql stable security definer;

drop policy if exists "Profiles readable by authenticated users" on public.profiles;
create policy "Profiles readable by authenticated users"
  on public.profiles for select to authenticated using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles"
  on public.profiles for all to authenticated using (public.current_user_role() = 'Admin');

drop policy if exists "Departments visible to authenticated users" on public.departments;
create policy "Departments visible to authenticated users"
  on public.departments for select to authenticated using (true);

drop policy if exists "Admins manage departments" on public.departments;
create policy "Admins manage departments"
  on public.departments for all to authenticated using (public.current_user_role() = 'Admin');

drop policy if exists "Categories visible to authenticated users" on public.asset_categories;
create policy "Categories visible to authenticated users"
  on public.asset_categories for select to authenticated using (true);

drop policy if exists "Managers manage categories" on public.asset_categories;
create policy "Managers manage categories"
  on public.asset_categories for all to authenticated using (public.is_manager());

drop policy if exists "Assets visible to authenticated users" on public.assets;
create policy "Assets visible to authenticated users"
  on public.assets for select to authenticated using (true);

drop policy if exists "Managers manage assets" on public.assets;
create policy "Managers manage assets"
  on public.assets for all to authenticated using (public.is_manager());

drop policy if exists "Allocations visible by involved users and leaders" on public.asset_allocations;
create policy "Allocations visible by involved users and leaders"
  on public.asset_allocations for select to authenticated
  using (
    allocated_to_id = auth.uid()
    or allocated_by_id = auth.uid()
    or public.current_user_role() in ('Admin', 'Asset_Manager', 'Department_Head')
  );

drop policy if exists "Managers manage allocations" on public.asset_allocations;
create policy "Managers manage allocations"
  on public.asset_allocations for all to authenticated using (public.is_manager());

drop policy if exists "Transfers visible by involved users and leaders" on public.transfer_requests;
create policy "Transfers visible by involved users and leaders"
  on public.transfer_requests for select to authenticated
  using (
    requested_by_id = auth.uid()
    or from_holder_id = auth.uid()
    or to_holder_id = auth.uid()
    or public.current_user_role() in ('Admin', 'Asset_Manager', 'Department_Head')
  );

drop policy if exists "Authenticated users create transfer requests" on public.transfer_requests;
create policy "Authenticated users create transfer requests"
  on public.transfer_requests for insert to authenticated with check (requested_by_id = auth.uid());

drop policy if exists "Leaders approve transfer requests" on public.transfer_requests;
create policy "Leaders approve transfer requests"
  on public.transfer_requests for update to authenticated
  using (public.current_user_role() in ('Admin', 'Asset_Manager', 'Department_Head'));

drop policy if exists "Bookings visible to authenticated users" on public.resource_bookings;
create policy "Bookings visible to authenticated users"
  on public.resource_bookings for select to authenticated using (true);

drop policy if exists "Bookings manageable by creator or managers" on public.resource_bookings;
create policy "Bookings manageable by creator or managers"
  on public.resource_bookings for all to authenticated
  using (booked_by_id = auth.uid() or public.is_manager())
  with check (booked_by_id = auth.uid() or public.is_manager());

drop policy if exists "Maintenance visible to involved users and managers" on public.maintenance_requests;
create policy "Maintenance visible to involved users and managers"
  on public.maintenance_requests for select to authenticated
  using (requested_by_id = auth.uid() or public.is_manager());

drop policy if exists "Authenticated users create maintenance" on public.maintenance_requests;
create policy "Authenticated users create maintenance"
  on public.maintenance_requests for insert to authenticated with check (requested_by_id = auth.uid());

drop policy if exists "Managers manage maintenance" on public.maintenance_requests;
create policy "Managers manage maintenance"
  on public.maintenance_requests for update to authenticated using (public.is_manager());

drop policy if exists "Audits visible to assigned users and managers" on public.audit_cycles;
create policy "Audits visible to assigned users and managers"
  on public.audit_cycles for select to authenticated
  using (
    public.is_manager()
    or exists (
      select 1 from public.audit_assignments aa
      where aa.audit_cycle_id = id and aa.auditor_id = auth.uid()
    )
  );

drop policy if exists "Managers manage audit cycles" on public.audit_cycles;
create policy "Managers manage audit cycles"
  on public.audit_cycles for all to authenticated using (public.is_manager());

drop policy if exists "Audit assignments visible by assigned users and managers" on public.audit_assignments;
create policy "Audit assignments visible by assigned users and managers"
  on public.audit_assignments for select to authenticated
  using (auditor_id = auth.uid() or public.is_manager());

drop policy if exists "Managers manage audit assignments" on public.audit_assignments;
create policy "Managers manage audit assignments"
  on public.audit_assignments for all to authenticated using (public.is_manager());

drop policy if exists "Audit items visible by assigned users and managers" on public.audit_items;
create policy "Audit items visible by assigned users and managers"
  on public.audit_items for select to authenticated
  using (
    public.is_manager()
    or auditor_id = auth.uid()
    or exists (
      select 1 from public.audit_assignments aa
      where aa.audit_cycle_id = audit_cycle_id and aa.auditor_id = auth.uid()
    )
  );

drop policy if exists "Assigned users update audit items" on public.audit_items;
create policy "Assigned users update audit items"
  on public.audit_items for update to authenticated
  using (public.is_manager() or auditor_id = auth.uid());

drop policy if exists "Managers manage audit items" on public.audit_items;
create policy "Managers manage audit items"
  on public.audit_items for all to authenticated using (public.is_manager());

drop policy if exists "Notifications private to user" on public.notifications;
create policy "Notifications private to user"
  on public.notifications for all to authenticated using (user_id = auth.uid());

drop policy if exists "Activity logs visible to managers" on public.activity_logs;
create policy "Activity logs visible to managers"
  on public.activity_logs for select to authenticated using (public.is_manager());

drop policy if exists "Managers insert activity logs" on public.activity_logs;
create policy "Managers insert activity logs"
  on public.activity_logs for insert to authenticated with check (public.is_manager());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('asset-photos', 'asset-photos', false, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('asset-documents', 'asset-documents', false, 5242880, array['application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
