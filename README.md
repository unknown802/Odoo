# AssetFlow Enterprise

AssetFlow Enterprise is a full-stack asset and resource operations platform built with Vite, React, Node.js, Express, TypeScript, and Supabase.

It replaces spreadsheet-based tracking with governed workflows for:

- Asset registration, allocation, transfer, and return
- Resource booking with temporal conflict prevention
- Maintenance request approval and resolution
- Structured audit cycles with discrepancy handling
- Realtime notifications and activity logging
- Reports, analytics, CSV exports, and PDF audit output

## Product Capabilities

- Lifecycle control: generated asset tags, QR support, custody history, condition tracking, and status automation.
- Conflict prevention: server-side allocation checks and temporal booking overlap validation.
- Workflow governance: role-gated transfer, maintenance, audit, reporting, and organization management flows.
- Operational visibility: dashboard KPIs, overdue queues, utilization analytics, notifications, and activity logs.
- Database security: Supabase RLS policies, profile bootstrap triggers, indexes, storage buckets, and service-role-only backend operations.

## Stack

- Frontend: Vite, React 18, TypeScript, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod, Recharts, Lucide, QR tooling
- Backend: Node.js, Express, TypeScript, Zod, Supabase JS
- Database: Supabase PostgreSQL with RLS policies, triggers, and indexes

## Architecture

```text
frontend/      Role-aware React application and local sample workspace
backend/       Express API, auth middleware, business rules, services, tests
supabase/      PostgreSQL schema, RLS policies, triggers, seed data
docs/          Product, API, and deployment documentation
```

## Local Setup

Copy the environment templates and fill in your local values:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Do not commit real database passwords, service role keys, or direct connection strings.

Install dependencies:

```bash
npm install
```

Run the frontend and backend together:

```bash
npm run dev
```

Run builds and tests:

```bash
npm run build
npm test
```

## Supabase Setup

The project includes a Supabase migration under `supabase/migrations`.

CLI flow:

```bash
supabase login
supabase init
supabase link --project-ref <your-project-ref>
supabase db push
```

For project setup notes, see [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

## Product Guide

Use [docs/PRODUCT_GUIDE.md](docs/PRODUCT_GUIDE.md) for workflow details and [docs/API.md](docs/API.md) for backend endpoint notes.

## Local Sample Workspace

The frontend can run against local sample workspace data when Supabase environment variables are not configured. This keeps product development and UI review available before connecting a live database.

## Quality Gates

```bash
npm run typecheck
npm test
npm run build
```
