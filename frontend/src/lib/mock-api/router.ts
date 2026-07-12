import { assetsService } from "./services/assets.service";
import { allocationsService } from "./services/allocations.service";
import { maintenanceService } from "./services/maintenance.service";
import { bookingsService } from "./services/bookings.service";
import { auditsService } from "./services/audits.service";
import { orgService } from "./services/org.service";
import { reportsService } from "./services/reports.service";

// Simulated user (in a real app, this comes from auth context/token)
const MOCK_USER_ID = "user-admin"; 

export async function mockApiRouter(endpoint: string, options?: RequestInit): Promise<any> {
  const method = (options?.method || "GET").toUpperCase();
  const url = new URL(endpoint, "http://localhost");
  const path = url.pathname;
  
  // Parse body if it exists
  let body = {};
  if (options?.body) {
    body = JSON.parse(options.body as string);
  }

  // Assets
  if (path === "/api/assets" && method === "GET") {
    const status = url.searchParams.get("status") || undefined;
    const category = url.searchParams.get("category") || undefined;
    const search = url.searchParams.get("search") || undefined;
    const page = url.searchParams.get("page") ? parseInt(url.searchParams.get("page")!) : undefined;
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : undefined;
    return assetsService.getAll({ status, category, search, page, limit });
  }
  if (path === "/api/assets" && method === "POST") return assetsService.create(MOCK_USER_ID, body);
  if (path.match(/^\/api\/assets\/([^\/]+)$/)) {
    const id = path.split("/")[3];
    if (method === "GET") return assetsService.getById(id);
    if (method === "PUT" || method === "PATCH") return assetsService.update(MOCK_USER_ID, id, body);
    if (method === "DELETE") {
      assetsService.delete(MOCK_USER_ID, id);
      return { success: true };
    }
  }

  // Allocations
  if (path === "/api/allocations" && method === "GET") return allocationsService.getAll();
  if (path === "/api/allocations" && method === "POST") return allocationsService.create(MOCK_USER_ID, body);
  if (path.match(/^\/api\/allocations\/([^\/]+)\/return$/) && method === "POST") {
    const id = path.split("/")[3];
    return allocationsService.returnAsset(MOCK_USER_ID, id, body as any);
  }

  // Transfers
  if (path === "/api/transfers" && method === "GET") return allocationsService.getTransfers();
  if (path === "/api/transfers" && method === "POST") return allocationsService.createTransfer(MOCK_USER_ID, body);
  if (path.match(/^\/api\/transfers\/([^\/]+)\/approve$/) && method === "POST") {
    const id = path.split("/")[3];
    return allocationsService.approveTransfer(MOCK_USER_ID, id);
  }

  // Maintenance
  if (path === "/api/maintenance" && method === "GET") return maintenanceService.getAll();
  if (path === "/api/maintenance" && method === "POST") return maintenanceService.create(MOCK_USER_ID, body);
  if (path.match(/^\/api\/maintenance\/([^\/]+)\/status$/) && (method === "PUT" || method === "PATCH" || method === "POST")) {
    const id = path.split("/")[3];
    return maintenanceService.moveStatus(MOCK_USER_ID, id, (body as any).action);
  }
  if (path.match(/^\/api\/maintenance\/([^\/]+)$/)) {
    const id = path.split("/")[3];
    if (method === "PATCH" || method === "PUT") return maintenanceService.update(MOCK_USER_ID, id, body);
    if (method === "DELETE") {
      maintenanceService.delete(MOCK_USER_ID, id);
      return { success: true };
    }
  }

  // Bookings
  if (path === "/api/bookings" && method === "GET") return bookingsService.getAll();
  if (path === "/api/bookings" && method === "POST") return bookingsService.create(MOCK_USER_ID, body);
  if (path.match(/^\/api\/bookings\/([^\/]+)$/)) {
    const id = path.split("/")[3];
    if (method === "PATCH" || method === "PUT") return bookingsService.update(MOCK_USER_ID, id, body);
    if (method === "DELETE") {
      bookingsService.cancel(MOCK_USER_ID, id);
      return { success: true };
    }
  }

  // Audits
  if (path === "/api/audits" && method === "GET") return auditsService.getAll();
  if (path === "/api/audits" && method === "POST") return auditsService.create(MOCK_USER_ID, body);
  if (path.match(/^\/api\/audits\/([^\/]+)$/)) {
    const id = path.split("/")[3];
    if (method === "PATCH" || method === "PUT") return auditsService.update(MOCK_USER_ID, id, body);
    if (method === "DELETE") {
      auditsService.delete(MOCK_USER_ID, id);
      return { success: true };
    }
  }
  if (path.match(/^\/api\/audits\/([^\/]+)\/items\/([^\/]+)$/) && method === "PATCH") {
    const cycleId = path.split("/")[3];
    const itemId = path.split("/")[5];
    auditsService.updateItem(MOCK_USER_ID, cycleId, itemId, body);
    return { success: true };
  }
  if (path.match(/^\/api\/audits\/([^\/]+)\/close$/) && method === "POST") {
    const cycleId = path.split("/")[3];
    auditsService.closeCycle(MOCK_USER_ID, cycleId);
    return { success: true };
  }

  // Org
  if (path === "/api/org/bootstrap" && method === "GET") {
    return {
      departments: orgService.getDepartments(),
      profiles: orgService.getProfiles(),
      categories: orgService.getCategories(),
    };
  }
  if (path === "/api/org/departments" && method === "POST") return orgService.createDepartment(body);
  if (path.match(/^\/api\/org\/departments\/([^\/]+)$/) && method === "DELETE") {
    orgService.deleteDepartment(path.split("/")[4]);
    return { success: true };
  }
  if (path === "/api/org/categories" && method === "POST") return orgService.createCategory(body);
  if (path.match(/^\/api\/org\/categories\/([^\/]+)$/) && method === "DELETE") {
    orgService.deleteCategory(path.split("/")[4]);
    return { success: true };
  }
  if (path === "/api/org/me" && method === "GET") {
    const profile = orgService.getProfiles().find((p: any) => p.id === MOCK_USER_ID);
    if (!profile) throw new Error("User not found");
    const dept = orgService.getDepartments().find((d: any) => d.id === profile.department_id);
    return { ...profile, department: dept };
  }
  if (path.match(/^\/api\/org\/profiles\/([^\/]+)\/role$/) && method === "PATCH") {
    const id = path.split("/")[4];
    orgService.updateRole(id, (body as any).role);
    return { success: true };
  }

  // Reports/Misc
  if (path === "/api/reports/summary" && method === "GET") return reportsService.getSummary();
  if (path === "/api/reports/analytics" && method === "GET") return reportsService.getAnalytics();
  if (path === "/api/reports/activity" && method === "GET") return reportsService.getRecentActivity();
  if (path === "/api/notifications" && method === "GET") return reportsService.getNotifications();
  if (path === "/api/notifications/mark-all-read" && method === "PATCH") {
    const notifs = reportsService.getNotifications();
    notifs.forEach((n: any) => n.is_read = true);
    return { success: true };
  }

  throw new Error(`Mock Route not found: ${method} ${path}`);
}
