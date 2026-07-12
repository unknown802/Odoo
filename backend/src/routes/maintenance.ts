import { Router } from "express";
import { getSupabaseAdminClient } from "../config/supabase.js";
import { ApiError, asyncHandler } from "../errors.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createMaintenanceSchema, idParamsSchema, resolveMaintenanceSchema } from "../schemas.js";
import { logActivity } from "../services/activityLogService.js";
import { notificationService } from "../services/notificationService.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const maintenanceRouter = Router();

maintenanceRouter.use(auth);

maintenanceRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("maintenance_requests")
      .select("*, asset:assets(name, asset_tag, location), requester:profiles!maintenance_requests_requested_by_id_fkey(full_name)")
      .order("requested_at", { ascending: false });

    if (error) throw new ApiError(500, error.message);
    res.json(data);
  })
);

maintenanceRouter.post(
  "/",
  validate(createMaintenanceSchema),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("maintenance_requests")
      .insert({ ...req.body, requested_by_id: req.user.id, status: "Pending" })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    await logActivity(req, "Maintenance requested", "maintenance_request", data.id, {
      asset_id: req.body.asset_id,
      priority: req.body.priority
    });

    res.status(201).json(data);
  })
);

maintenanceRouter.post(
  "/:id/approve",
  requireRole(["Admin", "Asset_Manager"]),
  validate(idParamsSchema, "params"),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data: request, error: findError } = await supabase
      .from("maintenance_requests")
      .select("id, asset_id, requested_by_id, status")
      .eq("id", req.params.id)
      .single();

    if (findError || !request) throw new ApiError(404, "Maintenance request not found");
    if (request.status !== "Pending") throw new ApiError(400, "Request is not pending approval");

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("maintenance_requests")
      .update({ status: "Approved", approved_by_id: req.user.id, approved_at: now })
      .eq("id", req.params.id);

    if (error) throw new ApiError(500, error.message);

    await supabase.from("assets").update({ status: "Under_Maintenance" }).eq("id", request.asset_id);
    await notificationService.create({
      user_id: request.requested_by_id,
      type: "Maintenance_Approved",
      title: "Maintenance approved",
      message: "Your maintenance request was approved.",
      data: { request_id: request.id, asset_id: request.asset_id }
    });
    await logActivity(req, "Maintenance approved", "maintenance_request", request.id);

    res.json({ message: "Maintenance approved. Asset status updated to Under Maintenance." });
  })
);

maintenanceRouter.post(
  "/:id/reject",
  requireRole(["Admin", "Asset_Manager"]),
  validate(idParamsSchema, "params"),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("maintenance_requests")
      .update({ status: "Rejected", approved_by_id: req.user.id, approved_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    await logActivity(req, "Maintenance rejected", "maintenance_request", data.id);
    res.json(data);
  })
);

maintenanceRouter.post(
  "/:id/start",
  requireRole(["Admin", "Asset_Manager"]),
  validate(idParamsSchema, "params"),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("maintenance_requests")
      .update({ status: "In_Progress", started_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    await logActivity(req, "Maintenance started", "maintenance_request", data.id);
    res.json(data);
  })
);

maintenanceRouter.post(
  "/:id/resolve",
  requireRole(["Admin", "Asset_Manager"]),
  validate(idParamsSchema, "params"),
  validate(resolveMaintenanceSchema),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data: request, error: findError } = await supabase
      .from("maintenance_requests")
      .select("id, asset_id, requested_by_id")
      .eq("id", req.params.id)
      .single();

    if (findError || !request) throw new ApiError(404, "Maintenance request not found");

    const { data, error } = await supabase
      .from("maintenance_requests")
      .update({
        status: "Resolved",
        resolved_at: new Date().toISOString(),
        resolution_notes: req.body.resolution_notes,
        cost: req.body.cost
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    await supabase.from("assets").update({ status: "Available" }).eq("id", request.asset_id);
    await notificationService.create({
      user_id: request.requested_by_id,
      type: "Maintenance_Resolved",
      title: "Maintenance resolved",
      message: "Your asset maintenance request has been resolved.",
      data: { request_id: request.id, asset_id: request.asset_id }
    });
    await logActivity(req, "Maintenance resolved", "maintenance_request", data.id);

    res.json({ message: "Maintenance resolved. Asset is now Available.", request: data });
  })
);
