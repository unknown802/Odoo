import { Router } from "express";
import { getSupabaseAdminClient } from "../config/supabase.js";
import { ApiError, asyncHandler } from "../errors.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createAllocationSchema, idParamsSchema, returnAllocationSchema } from "../schemas.js";
import { createAllocationWithConflictCheck } from "../services/assetService.js";
import { logActivity } from "../services/activityLogService.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const allocationsRouter = Router();

allocationsRouter.use(auth);

allocationsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("asset_allocations")
      .select("*, asset:assets(*), holder:profiles!asset_allocations_allocated_to_id_fkey(full_name)")
      .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, error.message);
    res.json(data);
  })
);

allocationsRouter.post(
  "/",
  requireRole(["Admin", "Asset_Manager"]),
  validate(createAllocationSchema),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const data = await createAllocationWithConflictCheck(req.body, req.user);
    await logActivity(req, "Asset allocated", "asset_allocation", data.id, req.body);
    res.status(201).json(data);
  })
);

allocationsRouter.patch(
  "/:id/return",
  requireRole(["Admin", "Asset_Manager"]),
  validate(idParamsSchema, "params"),
  validate(returnAllocationSchema),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("asset_allocations")
      .update({
        status: "Returned",
        returned_at: new Date().toISOString(),
        return_condition: req.body.return_condition,
        return_notes: req.body.return_notes
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    await logActivity(req, "Asset returned", "asset_allocation", data.id, {
      return_condition: req.body.return_condition
    });

    res.json(data);
  })
);
