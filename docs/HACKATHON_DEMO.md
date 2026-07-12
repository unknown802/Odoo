# AssetFlow Enterprise Demo Guide

## 30-Second Pitch

AssetFlow is a modular, real-time Enterprise Asset and Resource Management System that replaces spreadsheets with intelligent workflows. It tracks assets through their full lifecycle, prevents double-allocation with conflict engines, validates resource bookings with temporal overlap detection, routes maintenance through approval workflows, and runs structured audit cycles with role-based security and realtime notifications.

## Winning Walkthrough

1. Open the Dashboard.
   - Show live KPI cards for available assets, allocated assets, active bookings, maintenance, transfers, and upcoming returns.
   - Point out the overdue return row and the role switcher.

2. Switch roles.
   - Admin sees Organization, Reports, and Activity.
   - Employee sees the operational screens but not admin-only setup.

3. Register an asset.
   - Go to Assets.
   - Add a new asset with category, condition, cost, location, department, and bookable toggle.
   - Show the generated `AF-XXXX` tag and QR code.

4. Trigger conflict detection.
   - Go to Allocation.
   - Select an already allocated asset.
   - The UI blocks allocation and guides the user to create a transfer request.

5. Approve a transfer.
   - Create or select a requested transfer.
   - Approve it and show the asset re-allocated to the new holder.

6. Prevent booking overlap.
   - Go to Bookings.
   - Try a booking that overlaps an existing slot.
   - Show the frontend conflict warning and explain that the backend repeats the same validation.

7. Maintenance workflow.
   - Raise a maintenance request.
   - Move it from Pending to Approved, In Progress, and Resolved.
   - Explain that approval sets the asset to `Under_Maintenance`, while resolution returns it to `Available`.

8. Run an audit.
   - Create an audit cycle scoped by department or location.
   - Mark items Verified, Missing, or Damaged.
   - Export the PDF report.
   - Close the cycle and show missing assets marked `Lost`.

9. Reports and activity.
   - Show utilization, maintenance frequency, department allocation charts, CSV export, notifications, and activity logs.

## Judge-Facing Differentiators

- Real conflict rules implemented in both frontend demo state and backend services.
- Supabase migration includes RLS policies, indexes, triggers, storage buckets, and auth profile bootstrap.
- Backend endpoints isolate business rules for allocation, bookings, transfers, maintenance, audits, reports, and notifications.
- Frontend remains usable in demo mode without Supabase env variables.
- Role-aware navigation makes security visible during the live demo.

## Local Demo Commands

```bash
npm install
npm run dev
```

Open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:4000/health

## Production Notes

- Frontend can deploy to Vercel.
- Backend can deploy to Railway, Render, or Fly.io.
- Supabase migration can be pushed with `supabase db push`.
- Configure service role keys only in backend hosting environment variables.
