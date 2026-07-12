insert into public.asset_categories (id, name, custom_fields)
values
  ('00000000-0000-0000-0000-000000000101', 'Laptop', '{"warranty_months":"number","cpu":"text"}'),
  ('00000000-0000-0000-0000-000000000102', 'Meeting Room', '{"capacity":"number","floor":"text"}'),
  ('00000000-0000-0000-0000-000000000103', 'Lab Equipment', '{"calibration_due":"date"}')
on conflict do nothing;

insert into public.departments (id, name)
values
  ('00000000-0000-0000-0000-000000000201', 'Engineering'),
  ('00000000-0000-0000-0000-000000000202', 'Operations'),
  ('00000000-0000-0000-0000-000000000203', 'Finance')
on conflict do nothing;
