import { Router } from "express";
import { getSupabaseAdminClient } from "../config/supabase.js";
import { ApiError, asyncHandler } from "../errors.js";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createBookingSchema, idParamsSchema } from "../schemas.js";
import { createBookingWithOverlapCheck } from "../services/bookingService.js";
import { logActivity } from "../services/activityLogService.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const bookingsRouter = Router();

bookingsRouter.use(auth);

bookingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("resource_bookings")
      .select("*, resource:assets(name, asset_tag, location), booker:profiles(full_name)")
      .order("start_time", { ascending: true });

    if (typeof req.query.resource_id === "string") {
      query = query.eq("resource_id", req.query.resource_id);
    }

    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);
    res.json(data);
  })
);

bookingsRouter.post(
  "/",
  validate(createBookingSchema),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const data = await createBookingWithOverlapCheck(req.body, req.user);
    await logActivity(req, "Resource booked", "resource_booking", data.id, req.body);
    res.status(201).json(data);
  })
);

bookingsRouter.patch(
  "/:id/cancel",
  validate(idParamsSchema, "params"),
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("resource_bookings")
      .update({ status: "Cancelled" })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    await logActivity(req, "Booking cancelled", "resource_booking", data.id);
    res.json(data);
  })
);
