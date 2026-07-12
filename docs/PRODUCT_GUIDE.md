# AssetFlow Enterprise Product Guide

## Platform Overview

AssetFlow Enterprise is an asset and resource operations platform for organizations that need stronger control than spreadsheets can provide. It centralizes asset inventory, allocation, shared resource booking, maintenance workflows, audit execution, realtime notifications, and operational reporting.

The application is designed around four operating principles:

- Prevent allocation and booking conflicts before they become operational incidents.
- Keep ownership, maintenance, and audit history attached to every asset.
- Enforce role-aware access at both the application and database layers.
- Make operational risk visible through dashboards, reports, alerts, and activity logs.

## Core Workflows

### Asset Lifecycle

Assets are registered with category, condition, location, acquisition details, bookable status, generated asset tag, QR code support, and ownership metadata. Allocation and return events update asset status automatically and preserve a full chain of custody.

### Allocation and Transfer Control

The allocation workflow blocks assets that are already allocated, under maintenance, lost, retired, or disposed. When an asset is already assigned, users are directed into a transfer workflow so the existing holder, target holder, approver, and activity trail remain explicit.

### Resource Booking

Bookable assets can be reserved with start and end times. The booking engine rejects overlapping windows using the standard interval rule:

```text
existing.start < requested.end AND existing.end > requested.start
```

Cancelled bookings are excluded from conflict checks.

### Maintenance Operations

Employees can raise maintenance requests against assets. Asset managers and administrators can approve, reject, start, and resolve work. Approval moves the asset into `Under_Maintenance`; resolution returns it to `Available`.

### Audit Execution

Audit cycles can be scoped by department and location. Matching assets become audit items that auditors can mark as `Verified`, `Missing`, or `Damaged`. Closing an audit locks the cycle and marks missing assets as `Lost`.

### Reporting and Notifications

The reporting layer includes utilization, department allocation, maintenance frequency, overdue returns, CSV export, and activity logs. Notifications are stored in Supabase and are wired for realtime delivery.

## Operating Roles

- Admin: organization setup, user roles, asset operations, audits, reporting, and logs.
- Asset Manager: asset operations, allocation, transfers, maintenance, audits, reporting, and logs.
- Department Head: department-level visibility, transfers, bookings, audit participation, and reports.
- Employee: assigned assets, bookings, maintenance requests, audit execution when assigned, and notifications.

## Local Run

```bash
npm install
npm run dev
```

Open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:4000/health

When Supabase environment variables are not configured, the frontend uses local sample workspace data so the product shell remains available for development and review.

## Production Readiness Notes

- The database migration includes RLS policies, indexes, triggers, and storage buckets.
- Backend routes repeat critical business validation instead of trusting the client.
- Service role keys and database connection strings must remain server-side only.
- File upload buckets enforce size and MIME restrictions.
- Every mutating API workflow is prepared for activity logging.
