import type { Request } from "express";

export type Role = "Admin" | "Asset_Manager" | "Department_Head" | "Employee";

export interface UserContext {
  id: string;
  email?: string;
  full_name?: string;
  role: Role;
  department_id?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: UserContext;
}

export interface NotificationPayload {
  user_id: string;
  type: string;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
}

export interface AssetAvailability {
  id: string;
  name: string;
  asset_tag: string | null;
  status: string;
  current_holder_id?: string | null;
}

export interface BookingWindow {
  id?: string;
  start_time: string | Date;
  end_time: string | Date;
  status?: string;
}
