# Supabase Setup

## Project Link

Use the Supabase CLI to link the hosted project:

```bash
supabase login
supabase init
supabase link --project-ref emzedfzatwaqgeujzynv
```

Then apply migrations:

```bash
supabase db push
```

## Environment Variables

Frontend:

```bash
cp frontend/.env.example frontend/.env.local
```

Backend:

```bash
cp backend/.env.example backend/.env
```

Required values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_API_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Keep database passwords, direct connection strings, and service role keys out of git.

## Database Coverage

The migration creates:

- Core tables for profiles, departments, categories, assets, allocations, transfers, bookings, maintenance, audits, notifications, and activity logs.
- Indexes for status, asset tags, booking windows, notifications, and activity log queries.
- Triggers for asset tag generation, profile bootstrap after signup, updated timestamps, allocation status sync, and overdue flagging.
- RLS policies for profiles, organization setup, assets, allocations, transfers, bookings, maintenance, audits, notifications, and activity logs.
- Storage buckets for asset photos and asset documents.

## Direct Connection

Use the Supabase dashboard or local secrets manager for the direct PostgreSQL connection string. Do not place it in committed files.
