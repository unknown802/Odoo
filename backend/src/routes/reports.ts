import { Router } from "express";
import { getSupabaseAdminClient } from "../config/supabase.js";
import { ApiError, asyncHandler } from "../errors.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

export const reportsRouter = Router();

reportsRouter.use(auth, requireRole(["Admin", "Asset_Manager", "Department_Head"]));

async function countRows(table: string, filters: Record<string, string> = {}) {
  const supabase = getSupabaseAdminClient();
  let query = supabase.from(table).select("*", { count: "exact", head: true });

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { count, error } = await query;
  if (error) throw new ApiError(500, error.message);
  return count ?? 0;
}

reportsRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const [
      assetsAvailable,
      assetsAllocated,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      activeAllocations
    ] = await Promise.all([
      countRows("assets", { status: "Available" }),
      countRows("assets", { status: "Allocated" }),
      countRows("maintenance_requests", { status: "In_Progress" }),
      countRows("resource_bookings", { status: "Upcoming" }),
      countRows("transfer_requests", { status: "Requested" }),
      countRows("asset_allocations", { status: "Active" })
    ]);

    res.json({
      assetsAvailable,
      assetsAllocated,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      activeAllocations
    });
  })
);

reportsRouter.get(
  "/overdue",
  asyncHandler(async (_req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("asset_allocations")
      .select("*, asset:assets(name, asset_tag), holder:profiles!asset_allocations_allocated_to_id_fkey(full_name)")
      .eq("status", "Active")
      .lt("expected_return_date", new Date().toISOString().slice(0, 10))
      .order("expected_return_date", { ascending: true });

    if (error) throw new ApiError(500, error.message);
    res.json(data);
  })
);

reportsRouter.get(
  "/activity",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from("activity_logs").select("*, user:profiles(full_name, email)").order("created_at", { ascending: false });

    if (typeof req.query.action === "string") query = query.ilike("action", `%${req.query.action}%`);
    if (typeof req.query.user_id === "string") query = query.eq("user_id", req.query.user_id);

    const { data, error } = await query.limit(250);
    if (error) throw new ApiError(500, error.message);
    res.json(data);
  })
);
