export type Role = "Admin" | "Asset_Manager" | "Department_Head" | "Employee";

export type AssetStatus =
  | "Available"
  | "Allocated"
  | "Reserved"
  | "Under_Maintenance"
  | "Lost"
  | "Retired"
  | "Disposed";

export type Condition = "New" | "Good" | "Fair" | "Poor" | "Damaged";

export type ViewKey =
  | "dashboard"
  | "auth"
  | "organization"
  | "assets"
  | "allocation"
  | "bookings"
  | "maintenance"
  | "audits"
  | "reports"
  | "activity";

export interface Department {
  id: string;
  name: string;
  head_id?: string | null;
  parent_department_id?: string | null;
  status: "Active" | "Inactive";
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  department_id?: string | null;
  status: "Active" | "Inactive";
}

export interface AssetCategory {
  id: string;
  name: string;
  custom_fields: Record<string, string>;
  status: "Active" | "Inactive";
}

export interface Asset {
  id: string;
  name: string;
  category_id: string;
  asset_tag: string;
  serial_number?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
  condition: Condition;
  location: string;
  status: AssetStatus;
  is_bookable: boolean;
  current_holder_id?: string | null;
  current_department_id?: string | null;
  photos: string[];
  documents: string[];
  created_at: string;
}

export interface Allocation {
  id: string;
  asset_id: string;
  allocated_to_id?: string | null;
  allocated_to_department_id?: string | null;
  allocated_by_id: string;
  allocated_at: string;
  expected_return_date?: string;
  returned_at?: string | null;
  return_condition?: Condition;
  return_notes?: string;
  status: "Active" | "Returned" | "Overdue" | "Transferred";
}

export interface TransferRequest {
  id: string;
  asset_id: string;
  from_holder_id?: string | null;
  to_holder_id: string;
  requested_by_id: string;
  approved_by_id?: string | null;
  status: "Requested" | "Approved" | "Rejected" | "Completed";
  requested_at: string;
  notes?: string;
}

export interface Booking {
  id: string;
  resource_id: string;
  booked_by_id: string;
  department_id?: string | null;
  start_time: string;
  end_time: string;
  purpose?: string;
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
}

export interface MaintenanceRequest {
  id: string;
  asset_id: string;
  requested_by_id: string;
  approved_by_id?: string | null;
  title: string;
  description?: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  photos: string[];
  status: "Pending" | "Approved" | "Rejected" | "In_Progress" | "Resolved";
  requested_at: string;
  resolution_notes?: string;
  cost?: number;
}

export interface AuditItem {
  id: string;
  audit_cycle_id: string;
  asset_id: string;
  auditor_id?: string | null;
  status: "Pending" | "Verified" | "Missing" | "Damaged";
  notes?: string;
  verified_at?: string | null;
}

export interface AuditCycle {
  id: string;
  title: string;
  scope_department_id?: string | null;
  scope_location?: string;
  start_date: string;
  end_date?: string;
  status: "Open" | "In_Progress" | "Closed";
  created_by_id: string;
  auditor_ids: string[];
  items: AuditItem[];
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, unknown>;
  created_at: string;
}
