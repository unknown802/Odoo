# AssetFlow API Notes

Base URL in local development:

```text
http://localhost:4000
```

All `/api/*` routes expect:

```http
Authorization: Bearer <supabase-jwt>
Content-Type: application/json
```

## Health

```http
GET /health
```

Returns API status plus whether Supabase auth/admin env values are configured.

## Allocation Conflict Engine

```http
POST /api/allocations
```

```json
{
  "asset_id": "uuid",
  "allocated_to_id": "uuid",
  "expected_return_date": "2026-07-25"
}
```

Rules:

- Rejects assets already `Allocated`.
- Rejects assets `Under_Maintenance`.
- Rejects assets that are `Lost`, `Retired`, or `Disposed`.
- Creates a notification for the new holder.

## Booking Overlap Engine

```http
POST /api/bookings
```

```json
{
  "resource_id": "uuid",
  "start_time": "2026-07-12T10:00:00.000Z",
  "end_time": "2026-07-12T11:00:00.000Z",
  "purpose": "Sprint planning"
}
```

Rules:

- Requires `end_time > start_time`.
- Requires the asset to be bookable.
- Rejects overlap using `(existing.start < requested.end) AND (existing.end > requested.start)`.
- Ignores cancelled bookings.

## Maintenance Workflow

```http
POST /api/maintenance
POST /api/maintenance/:id/approve
POST /api/maintenance/:id/start
POST /api/maintenance/:id/resolve
```

Rules:

- Any authenticated user can raise a request.
- Admin and Asset Manager can approve, start, reject, and resolve.
- Approval moves asset status to `Under_Maintenance`.
- Resolution moves asset status to `Available`.

## Transfer Workflow

```http
POST /api/transfers
POST /api/transfers/:id/approve
POST /api/transfers/:id/reject
```

Rules:

- Approval closes the old active allocation as `Transferred`.
- Approval creates a new active allocation for the target holder.
- Target holder receives a realtime-ready notification row.

## Audit Workflow

```http
POST /api/audits
PATCH /api/audits/:id/items/:itemId
POST /api/audits/:id/close
```

Rules:

- Creating a cycle snapshots matching assets into audit items.
- Audit item statuses are `Pending`, `Verified`, `Missing`, or `Damaged`.
- Closing a cycle marks missing assets as `Lost`.

## Reports

```http
GET /api/reports/summary
GET /api/reports/overdue
GET /api/reports/activity
```

Reports are role-gated for Admin, Asset Manager, and Department Head.
