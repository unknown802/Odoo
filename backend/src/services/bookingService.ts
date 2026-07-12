import { ApiError } from "../errors.js";
import { getSupabaseAdminClient } from "../config/supabase.js";
import { findBookingOverlaps } from "./conflictRules.js";
import { notificationService } from "./notificationService.js";
import type { BookingWindow, UserContext } from "../types/index.js";

export async function createBookingWithOverlapCheck(
  input: {
    resource_id: string;
    department_id?: string | null;
    start_time: string;
    end_time: string;
    purpose?: string;
  },
  user: UserContext
) {
  const supabase = getSupabaseAdminClient();
  const { data: resource, error: resourceError } = await supabase
    .from("assets")
    .select("id, name, asset_tag, is_bookable, status")
    .eq("id", input.resource_id)
    .single();

  if (resourceError || !resource) {
    throw new ApiError(404, "Resource not found");
  }

  if (!resource.is_bookable) {
    throw new ApiError(409, "Selected asset is not bookable");
  }

  if (["Under_Maintenance", "Lost", "Retired", "Disposed"].includes(resource.status)) {
    throw new ApiError(409, "Resource is not available for booking", { status: resource.status });
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("resource_bookings")
    .select("id, start_time, end_time, status")
    .eq("resource_id", input.resource_id)
    .neq("status", "Cancelled")
    .lt("start_time", input.end_time)
    .gt("end_time", input.start_time)
    .returns<BookingWindow[]>();

  if (bookingsError) {
    throw new ApiError(500, bookingsError.message);
  }

  const overlaps = findBookingOverlaps(bookings ?? [], input.start_time, input.end_time);

  if (overlaps.length > 0) {
    throw new ApiError(409, "Booking conflict", {
      message: "The requested time slot overlaps with an existing booking.",
      conflicts: overlaps
    });
  }

  const { data, error } = await supabase
    .from("resource_bookings")
    .insert({
      ...input,
      booked_by_id: user.id,
      status: "Upcoming"
    })
    .select()
    .single();

  if (error) {
    throw new ApiError(500, error.message);
  }

  await notificationService.create({
    user_id: user.id,
    type: "Booking_Confirmed",
    title: "Booking confirmed",
    message: `${resource.name} is reserved for your selected slot.`,
    data: { booking_id: data.id, resource_id: input.resource_id }
  });

  return data;
}
