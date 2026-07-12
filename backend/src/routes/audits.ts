import { Router } from "express";
import { getSupabaseAdminClient } from "../config/supabase.js";
import { ApiError, asyncHandler } from "../errors.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { auditItemParamsSchema, createAuditCycleSchema, idParamsSchema, updateAuditItemSchema } from "../schemas.js";
import { logActivity } from "../services/activityLogService.js";
import { missingAssetIds } from "../services/conflictRules.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const auditsRouter = Router();

auditsRouter.use(auth);

auditsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("audit_cycles")
      .select("*, assignments:audit_assignments(*), items:audit_items(*)")
      .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, error.message);
    res.json(data);
  })
);

auditsRouter.post(
  "/",
  requireRole(["Admin", "Asset_Manager"]),
  validate(createAuditCycleSchema),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { auditor_ids, ...cyclePayload } = req.body;
    const { data: cycle, error } = await supabase
      .from("audit_cycles")
      .insert({ ...cyclePayload, created_by_id: req.user.id })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    if (auditor_ids.length > 0) {
      await supabase.from("audit_assignments").insert(
        auditor_ids.map((auditor_id: string) => ({
          audit_cycle_id: cycle.id,
          auditor_id
        }))
      );
    }

    let assetQuery = supabase.from("assets").select("id");
    if (cycle.scope_department_id) assetQuery = assetQuery.eq("current_department_id", cycle.scope_department_id);
    if (cycle.scope_location) assetQuery = assetQuery.ilike("location", `%${cycle.scope_location}%`);

    const { data: assets } = await assetQuery;
    if (assets && assets.length > 0) {
      await supabase.from("audit_items").insert(
        assets.map((asset, index) => ({
          audit_cycle_id: cycle.id,
          asset_id: asset.id,
          auditor_id: auditor_ids[index % Math.max(auditor_ids.length, 1)] ?? null
        }))
      );
    }

    await logActivity(req, "Audit cycle created", "audit_cycle", cycle.id, {
      auditor_count: auditor_ids.length,
      item_count: assets?.length ?? 0
    });

    res.status(201).json(cycle);
  })
);

auditsRouter.patch(
  "/:id/items/:itemId",
  validate(auditItemParamsSchema, "params"),
  validate(updateAuditItemSchema),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("audit_items")
      .update({
        status: req.body.status,
        notes: req.body.notes,
        verified_at: req.body.status === "Pending" ? null : new Date().toISOString()
      })
      .eq("id", req.params.itemId)
      .eq("audit_cycle_id", req.params.id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    await logActivity(req, "Audit item updated", "audit_item", data.id, {
      status: req.body.status
    });

    res.json(data);
  })
);

auditsRouter.post(
  "/:id/close",
  requireRole(["Admin", "Asset_Manager"]),
  validate(idParamsSchema, "params"),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data: items, error: itemError } = await supabase
      .from("audit_items")
      .select("asset_id, status")
      .eq("audit_cycle_id", req.params.id);

    if (itemError) throw new ApiError(500, itemError.message);

    const missingIds = missingAssetIds(items ?? []);
    if (missingIds.length > 0) {
      await supabase.from("assets").update({ status: "Lost" }).in("id", missingIds);
    }

    const { data, error } = await supabase
      .from("audit_cycles")
      .update({ status: "Closed", end_date: new Date().toISOString().slice(0, 10) })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    await logActivity(req, "Audit cycle closed", "audit_cycle", data.id, {
      missing_assets_marked_lost: missingIds.length
    });

    res.json({
      message: "Audit cycle closed. Missing assets marked as Lost.",
      missing_assets_marked_lost: missingIds.length,
      cycle: data
    });
  })
);
