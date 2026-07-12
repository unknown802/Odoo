import { Router } from "express";
import { getSupabaseAdminClient } from "../config/supabase.js";
import { ApiError, asyncHandler } from "../errors.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createTransferSchema, idParamsSchema } from "../schemas.js";
import { logActivity } from "../services/activityLogService.js";
import { notificationService } from "../services/notificationService.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const transfersRouter = Router();

transfersRouter.use(auth);

transfersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("transfer_requests")
      .select("*, asset:assets(name, asset_tag), from_holder:profiles!transfer_requests_from_holder_id_fkey(full_name), to_holder:profiles!transfer_requests_to_holder_id_fkey(full_name)")
      .order("requested_at", { ascending: false });

    if (error) throw new ApiError(500, error.message);
    res.json(data);
  })
);

transfersRouter.post(
  "/",
  validate(createTransferSchema),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("transfer_requests")
      .insert({ ...req.body, requested_by_id: req.user.id, status: "Requested" })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    await logActivity(req, "Transfer requested", "transfer_request", data.id, req.body);
    res.status(201).json(data);
  })
);

transfersRouter.post(
  "/:id/approve",
  requireRole(["Admin", "Asset_Manager", "Department_Head"]),
  validate(idParamsSchema, "params"),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data: transfer, error: findError } = await supabase
      .from("transfer_requests")
      .select("id, asset_id, to_holder_id, status")
      .eq("id", req.params.id)
      .single();

    if (findError || !transfer) throw new ApiError(404, "Transfer request not found");
    if (transfer.status !== "Requested") throw new ApiError(400, "Transfer is not awaiting approval");

    const now = new Date().toISOString();
    await supabase
      .from("transfer_requests")
      .update({ status: "Approved", approved_by_id: req.user.id, approved_at: now })
      .eq("id", req.params.id);

    await supabase
      .from("asset_allocations")
      .update({ status: "Transferred", returned_at: now })
      .eq("asset_id", transfer.asset_id)
      .eq("status", "Active");

    await supabase.from("asset_allocations").insert({
      asset_id: transfer.asset_id,
      allocated_to_id: transfer.to_holder_id,
      allocated_by_id: req.user.id,
      status: "Active"
    });

    await supabase.from("transfer_requests").update({ status: "Completed", completed_at: now }).eq("id", req.params.id);

    await notificationService.create({
      user_id: transfer.to_holder_id,
      type: "Transfer_Approved",
      title: "Transfer approved",
      message: "An asset transfer to you has been approved.",
      data: { transfer_id: transfer.id, asset_id: transfer.asset_id }
    });
    await logActivity(req, "Transfer approved", "transfer_request", transfer.id);

    res.json({ message: "Transfer approved and asset re-allocated." });
  })
);

transfersRouter.post(
  "/:id/reject",
  requireRole(["Admin", "Asset_Manager", "Department_Head"]),
  validate(idParamsSchema, "params"),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("transfer_requests")
      .update({ status: "Rejected", approved_by_id: req.user.id, approved_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    await logActivity(req, "Transfer rejected", "transfer_request", data.id);
    res.json(data);
  })
);
