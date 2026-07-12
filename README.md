# AssetFlow Enterprise

AssetFlow Enterprise is a hackathon-ready asset and resource management system built with Vite, React, Node.js, Express, TypeScript, and Supabase.

It replaces spreadsheet-based asset tracking with role-aware workflows for:

- Asset registration, allocation, transfer, and return
- Resource booking with temporal conflict prevention
- Maintenance request approval and resolution
- Structured audit cycles with discrepancy handling
- Realtime notifications and activity logging
- Reports, analytics, CSV exports, and PDF audit output

## Stack

- Frontend: Vite, React 18, TypeScript, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod, Recharts, Lucide, QR tooling
- Backend: Node.js, Express, TypeScript, Zod, Supabase JS
- Database: Supabase PostgreSQL with RLS policies, triggers, and indexes

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

For the hackathon project reference and setup notes, see [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

## Demo Guide

Use [docs/HACKATHON_DEMO.md](docs/HACKATHON_DEMO.md) for the judge walkthrough and [docs/API.md](docs/API.md) for backend endpoint notes.

## Demo Mode

The frontend works in demo mode when Supabase environment variables are missing. This keeps the hackathon walkthrough usable even before the database is linked.

## Repository Structure

```text
backend/       Express API, business rules, auth middleware, services, tests
frontend/      Vite React app, role-aware screens, realtime hooks, charts
supabase/      PostgreSQL schema, RLS policies, triggers, seed data
```
