import { Router } from "express";
import { getSupabaseAdminClient } from "../config/supabase.js";
import { ApiError, asyncHandler } from "../errors.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

export const orgRouter = Router();

orgRouter.use(auth);

orgRouter.get(
  "/bootstrap",
  asyncHandler(async (_req, res) => {
    const supabase = getSupabaseAdminClient();
    const [departments, categories, profiles] = await Promise.all([
      supabase.from("departments").select("*").order("name"),
      supabase.from("asset_categories").select("*").order("name"),
      supabase.from("profiles").select("id, full_name, email, role, status, department_id").order("full_name")
    ]);

    for (const result of [departments, categories, profiles]) {
      if (result.error) throw new ApiError(500, result.error.message);
    }

    res.json({
      departments: departments.data ?? [],
      categories: categories.data ?? [],
      profiles: profiles.data ?? []
    });
  })
);

orgRouter.patch(
  "/profiles/:id/role",
  requireRole(["Admin"]),
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { role } = req.body;

    if (!["Admin", "Asset_Manager", "Department_Head", "Employee"].includes(role)) {
      throw new ApiError(422, "Invalid role");
    }

    const { data, error } = await supabase.from("profiles").update({ role }).eq("id", req.params.id).select().single();
    if (error) throw new ApiError(500, error.message);
    res.json(data);
  })
);
