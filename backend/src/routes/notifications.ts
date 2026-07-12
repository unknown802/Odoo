import { Router } from "express";
import { getSupabaseAdminClient } from "../config/supabase.js";
import { ApiError, asyncHandler } from "../errors.js";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamsSchema } from "../schemas.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const notificationsRouter = Router();

notificationsRouter.use(auth);

notificationsRouter.get(
  "/",
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new ApiError(500, error.message);
    res.json(data);
  })
);

notificationsRouter.patch(
  "/mark-all-read",
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", req.user.id);
    if (error) throw new ApiError(500, error.message);
    res.json({ message: "Notifications marked as read" });
  })
);

notificationsRouter.patch(
  "/:id/read",
  validate(idParamsSchema, "params"),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    res.json(data);
  })
);
