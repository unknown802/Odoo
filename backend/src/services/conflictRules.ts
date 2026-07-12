import type { AssetAvailability, BookingWindow } from "../types/index.js";

export function getAllocationBlocker(asset: AssetAvailability) {
  if (asset.status === "Allocated") {
    return {
      statusCode: 409,
      error: "Asset already allocated",
      message: `${asset.name} (${asset.asset_tag ?? "untagged"}) is currently allocated.`,
      current_holder_id: asset.current_holder_id,
      action: "Create Transfer Request instead"
    };
  }

  if (asset.status === "Under_Maintenance") {
    return {
      statusCode: 409,
      error: "Asset under maintenance",
      message: "This asset is currently undergoing maintenance and cannot be allocated."
    };
  }

  if (["Lost", "Retired", "Disposed"].includes(asset.status)) {
    return {
      statusCode: 409,
      error: "Asset unavailable",
      message: `This asset is ${asset.status} and cannot be allocated.`
    };
  }

  return null;
}

export function bookingOverlaps(existing: BookingWindow, requestedStart: Date, requestedEnd: Date) {
  if (existing.status === "Cancelled") {
    return false;
  }

  const existingStart = new Date(existing.start_time);
  const existingEnd = new Date(existing.end_time);

  return existingStart < requestedEnd && existingEnd > requestedStart;
}

export function findBookingOverlaps(bookings: BookingWindow[], startTime: string, endTime: string) {
  const requestedStart = new Date(startTime);
  const requestedEnd = new Date(endTime);

  return bookings.filter((booking) => bookingOverlaps(booking, requestedStart, requestedEnd));
}

export function missingAssetIds(items: Array<{ asset_id: string; status: string }>) {
  return items.filter((item) => item.status === "Missing").map((item) => item.asset_id);
}
