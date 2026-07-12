import { Router } from "express";
import { getSupabaseAdminClient } from "../config/supabase.js";
import { asyncHandler, ApiError } from "../errors.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createAssetSchema, idParamsSchema } from "../schemas.js";
import { logActivity } from "../services/activityLogService.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const assetsRouter = Router();

assetsRouter.use(auth);

assetsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { status, category, search } = req.query;

    let query = supabase
      .from("assets")
      .select("*, category:asset_categories(*), holder:profiles!assets_current_holder_id_fkey(full_name), department:departments(*)")
      .order("created_at", { ascending: false });

    if (typeof status === "string" && status !== "All") query = query.eq("status", status);
    if (typeof category === "string" && category !== "All") query = query.eq("category_id", category);
    if (typeof search === "string" && search.trim()) {
      query = query.or(`name.ilike.%${search}%,asset_tag.ilike.%${search}%,serial_number.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);
    res.json(data);
  })
);

assetsRouter.post(
  "/",
  requireRole(["Admin", "Asset_Manager"]),
  validate(createAssetSchema),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("assets").insert(req.body).select().single();

    if (error) throw new ApiError(500, error.message);

    await logActivity(req, "Asset registered", "asset", data.id, { asset_tag: data.asset_tag });
    res.status(201).json(data);
  })
);

assetsRouter.get(
  "/:id",
  validate(idParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const [{ data: asset, error }, allocations, maintenance] = await Promise.all([
      supabase.from("assets").select("*, category:asset_categories(*)").eq("id", id).single(),
      supabase.from("asset_allocations").select("*").eq("asset_id", id).order("created_at", { ascending: false }),
      supabase.from("maintenance_requests").select("*").eq("asset_id", id).order("requested_at", { ascending: false })
    ]);

    if (error || !asset) throw new ApiError(404, "Asset not found");

    res.json({
      asset,
      allocations: allocations.data ?? [],
      maintenance: maintenance.data ?? []
    });
  })
);
