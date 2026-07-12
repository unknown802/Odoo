import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Gauge,
  KeyRound,
  PackageCheck,
  Repeat2,
  Wrench
} from "lucide-react";
import type { Role, ViewKey } from "../types";

export const roleLabels: Record<Role, string> = {
  Admin: "Admin",
  Asset_Manager: "Asset Manager",
  Department_Head: "Department Head",
  Employee: "Employee"
};

export const navItems: Array<{
  key: ViewKey;
  label: string;
  icon: typeof Gauge;
  roles: Role[];
}> = [
  { key: "dashboard", label: "Dashboard", icon: Gauge, roles: ["Admin", "Asset_Manager", "Department_Head", "Employee"] },
  { key: "auth", label: "Auth", icon: KeyRound, roles: ["Admin", "Asset_Manager", "Department_Head", "Employee"] },
  { key: "organization", label: "Organization", icon: Building2, roles: ["Admin"] },
  { key: "assets", label: "Assets", icon: Boxes, roles: ["Admin", "Asset_Manager", "Department_Head", "Employee"] },
  { key: "allocation", label: "Allocation", icon: Repeat2, roles: ["Admin", "Asset_Manager", "Department_Head"] },
  { key: "bookings", label: "Bookings", icon: CalendarClock, roles: ["Admin", "Asset_Manager", "Department_Head", "Employee"] },
  { key: "maintenance", label: "Maintenance", icon: Wrench, roles: ["Admin", "Asset_Manager", "Department_Head", "Employee"] },
  { key: "audits", label: "Audits", icon: ClipboardCheck, roles: ["Admin", "Asset_Manager", "Department_Head", "Employee"] },
  { key: "reports", label: "Reports", icon: BarChart3, roles: ["Admin", "Asset_Manager", "Department_Head"] },
  { key: "activity", label: "Activity", icon: Activity, roles: ["Admin", "Asset_Manager"] }
];

export const notificationIcon = Bell;
export const assetIcon = PackageCheck;
