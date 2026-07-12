import { describe, expect, it } from "vitest";
import { findBookingOverlaps, getAllocationBlocker, missingAssetIds } from "../services/conflictRules.js";

describe("conflict rules", () => {
  it("blocks allocation when an asset is already allocated", () => {
    const blocker = getAllocationBlocker({
      id: "asset-1",
      name: "MacBook Pro",
      asset_tag: "AF-0001",
      status: "Allocated",
      current_holder_id: "user-1"
    });

    expect(blocker?.error).toBe("Asset already allocated");
    expect(blocker?.action).toBe("Create Transfer Request instead");
  });

  it("detects temporal booking overlaps", () => {
    const conflicts = findBookingOverlaps(
      [
        {
          id: "booking-1",
          start_time: "2026-07-12T10:00:00.000Z",
          end_time: "2026-07-12T11:00:00.000Z",
          status: "Upcoming"
        },
        {
          id: "booking-2",
          start_time: "2026-07-12T12:00:00.000Z",
          end_time: "2026-07-12T13:00:00.000Z",
          status: "Cancelled"
        }
      ],
      "2026-07-12T10:30:00.000Z",
      "2026-07-12T11:30:00.000Z"
    );

    expect(conflicts.map((conflict) => conflict.id)).toEqual(["booking-1"]);
  });

  it("returns missing assets for audit close", () => {
    expect(
      missingAssetIds([
        { asset_id: "asset-1", status: "Verified" },
        { asset_id: "asset-2", status: "Missing" },
        { asset_id: "asset-3", status: "Damaged" }
      ])
    ).toEqual(["asset-2"]);
  });
});
