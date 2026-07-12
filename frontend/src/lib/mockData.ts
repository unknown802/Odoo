import type {
  ActivityLog,
  Allocation,
  Asset,
  AssetCategory,
  AuditCycle,
  Booking,
  Department,
  MaintenanceRequest,
  NotificationItem,
  Profile,
  TransferRequest
} from "../types";

const now = new Date("2026-07-12T10:00:00+05:30");

export const departments: Department[] = [
  { id: "dept-eng", name: "Engineering", head_id: "user-meera", status: "Active" },
  { id: "dept-ops", name: "Operations", head_id: "user-dev", status: "Active" },
  { id: "dept-fin", name: "Finance", head_id: "user-ira", parent_department_id: "dept-ops", status: "Active" }
];

export const categories: AssetCategory[] = [
  { id: "cat-laptop", name: "Laptop", custom_fields: { warranty_months: "number", cpu: "text" }, status: "Active" },
  { id: "cat-room", name: "Meeting Room", custom_fields: { capacity: "number", floor: "text" }, status: "Active" },
  { id: "cat-lab", name: "Lab Equipment", custom_fields: { calibration_due: "date" }, status: "Active" },
  { id: "cat-vehicle", name: "Vehicle", custom_fields: { fuel_type: "text", mileage: "number" }, status: "Active" }
];

export const profiles: Profile[] = [
  { id: "user-admin", full_name: "Anika Rao", email: "anika@assetflow.local", role: "Admin", department_id: "dept-ops", status: "Active" },
  { id: "user-dev", full_name: "Dev Menon", email: "dev@assetflow.local", role: "Asset_Manager", department_id: "dept-ops", status: "Active" },
  { id: "user-meera", full_name: "Meera Shah", email: "meera@assetflow.local", role: "Department_Head", department_id: "dept-eng", status: "Active" },
  { id: "user-ira", full_name: "Ira Kapoor", email: "ira@assetflow.local", role: "Department_Head", department_id: "dept-fin", status: "Active" },
  { id: "user-omar", full_name: "Omar Khan", email: "omar@assetflow.local", role: "Employee", department_id: "dept-eng", status: "Active" },
  { id: "user-lina", full_name: "Lina Patel", email: "lina@assetflow.local", role: "Employee", department_id: "dept-ops", status: "Active" }
];

export const assets: Asset[] = [
  {
    id: "asset-001",
    name: "MacBook Pro 16",
    category_id: "cat-laptop",
    asset_tag: "AF-0001",
    serial_number: "MBP-9X2-118",
    acquisition_date: "2025-11-04",
    acquisition_cost: 2499,
    condition: "Good",
    location: "Engineering Bay",
    status: "Allocated",
    is_bookable: false,
    current_holder_id: "user-omar",
    current_department_id: "dept-eng",
    photos: [],
    documents: [],
    created_at: "2025-11-04T08:00:00.000Z"
  },
  {
    id: "asset-002",
    name: "Design Lab Conference Room",
    category_id: "cat-room",
    asset_tag: "AF-0002",
    serial_number: "ROOM-DL-02",
    acquisition_date: "2024-08-18",
    acquisition_cost: 0,
    condition: "Good",
    location: "Floor 4",
    status: "Available",
    is_bookable: true,
    current_holder_id: null,
    current_department_id: "dept-ops",
    photos: [],
    documents: [],
    created_at: "2024-08-18T08:00:00.000Z"
  },
  {
    id: "asset-003",
    name: "Thermal Imaging Kit",
    category_id: "cat-lab",
    asset_tag: "AF-0003",
    serial_number: "TIK-4430",
    acquisition_date: "2026-01-14",
    acquisition_cost: 7800,
    condition: "New",
    location: "Lab Storage",
    status: "Under_Maintenance",
    is_bookable: true,
    current_holder_id: null,
    current_department_id: "dept-eng",
    photos: [],
    documents: [],
    created_at: "2026-01-14T08:00:00.000Z"
  },
  {
    id: "asset-004",
    name: "Operations Van",
    category_id: "cat-vehicle",
    asset_tag: "AF-0004",
    serial_number: "VAN-117",
    acquisition_date: "2023-03-12",
    acquisition_cost: 31000,
    condition: "Fair",
    location: "Basement Parking",
    status: "Available",
    is_bookable: true,
    current_holder_id: null,
    current_department_id: "dept-ops",
    photos: [],
    documents: [],
    created_at: "2023-03-12T08:00:00.000Z"
  },
  {
    id: "asset-005",
    name: "Surface Laptop Studio",
    category_id: "cat-laptop",
    asset_tag: "AF-0005",
    serial_number: "SLS-7712",
    acquisition_date: "2025-04-20",
    acquisition_cost: 1999,
    condition: "Good",
    location: "Finance Desk",
    status: "Allocated",
    is_bookable: false,
    current_holder_id: "user-ira",
    current_department_id: "dept-fin",
    photos: [],
    documents: [],
    created_at: "2025-04-20T08:00:00.000Z"
  }
];

export const allocations: Allocation[] = [
  {
    id: "alloc-001",
    asset_id: "asset-001",
    allocated_to_id: "user-omar",
    allocated_to_department_id: "dept-eng",
    allocated_by_id: "user-dev",
    allocated_at: "2026-06-01T09:00:00.000Z",
    expected_return_date: "2026-07-05",
    returned_at: null,
    status: "Active"
  },
  {
    id: "alloc-002",
    asset_id: "asset-005",
    allocated_to_id: "user-ira",
    allocated_to_department_id: "dept-fin",
    allocated_by_id: "user-dev",
    allocated_at: "2026-06-18T09:00:00.000Z",
    expected_return_date: "2026-07-19",
    returned_at: null,
    status: "Active"
  }
];

export const bookings: Booking[] = [
  {
    id: "booking-001",
    resource_id: "asset-002",
    booked_by_id: "user-meera",
    department_id: "dept-eng",
    start_time: "2026-07-12T10:00:00.000Z",
    end_time: "2026-07-12T11:30:00.000Z",
    purpose: "Sprint planning",
    status: "Upcoming"
  },
  {
    id: "booking-002",
    resource_id: "asset-004",
    booked_by_id: "user-lina",
    department_id: "dept-ops",
    start_time: "2026-07-13T07:30:00.000Z",
    end_time: "2026-07-13T10:30:00.000Z",
    purpose: "Vendor pickup",
    status: "Upcoming"
  }
];

export const maintenanceRequests: MaintenanceRequest[] = [
  {
    id: "maint-001",
    asset_id: "asset-003",
    requested_by_id: "user-meera",
    approved_by_id: "user-dev",
    title: "Calibration drift",
    description: "Thermal reading variance observed during QA checks.",
    priority: "High",
    photos: [],
    status: "In_Progress",
    requested_at: "2026-07-10T08:10:00.000Z"
  },
  {
    id: "maint-002",
    asset_id: "asset-004",
    requested_by_id: "user-lina",
    title: "Service due",
    description: "Scheduled oil and brake inspection.",
    priority: "Medium",
    photos: [],
    status: "Pending",
    requested_at: "2026-07-12T04:00:00.000Z"
  }
];

export const transferRequests: TransferRequest[] = [
  {
    id: "transfer-001",
    asset_id: "asset-001",
    from_holder_id: "user-omar",
    to_holder_id: "user-meera",
    requested_by_id: "user-meera",
    status: "Requested",
    requested_at: "2026-07-12T06:00:00.000Z",
    notes: "Needed for client review workstation."
  }
];

export const auditCycles: AuditCycle[] = [
  {
    id: "audit-001",
    title: "Q3 Engineering Floor Audit",
    scope_department_id: "dept-eng",
    scope_location: "Engineering",
    start_date: "2026-07-12",
    status: "In_Progress",
    created_by_id: "user-admin",
    auditor_ids: ["user-meera", "user-omar"],
    items: [
      { id: "audit-item-001", audit_cycle_id: "audit-001", asset_id: "asset-001", auditor_id: "user-meera", status: "Verified", notes: "Desk B14" },
      { id: "audit-item-002", audit_cycle_id: "audit-001", asset_id: "asset-003", auditor_id: "user-omar", status: "Damaged", notes: "Awaiting calibration" }
    ]
  }
];

export const notifications: NotificationItem[] = [
  {
    id: "note-001",
    user_id: "user-omar",
    type: "Overdue_Return",
    title: "Return overdue",
    message: "MacBook Pro 16 was due on Jul 5.",
    is_read: false,
    created_at: now.toISOString()
  },
  {
    id: "note-002",
    user_id: "user-meera",
    type: "Transfer_Requested",
    title: "Transfer awaiting approval",
    message: "MacBook Pro 16 transfer is waiting for a manager.",
    is_read: false,
    created_at: now.toISOString()
  }
];

export const activityLogs: ActivityLog[] = [
  {
    id: "log-001",
    user_id: "user-dev",
    action: "Maintenance approved",
    entity_type: "maintenance_request",
    entity_id: "maint-001",
    details: { status: "Under_Maintenance" },
    created_at: "2026-07-10T09:00:00.000Z"
  },
  {
    id: "log-002",
    user_id: "user-meera",
    action: "Transfer requested",
    entity_type: "transfer_request",
    entity_id: "transfer-001",
    details: { reason: "Client review" },
    created_at: "2026-07-12T06:00:00.000Z"
  }
];
