import { useMemo } from "react";
import { daysOverdue } from "../lib/utils";
import { useAssetFlowStore } from "../store/assetFlowStore";

export function useDashboard() {
  const assets = useAssetFlowStore((state) => state.assets);
  const allocations = useAssetFlowStore((state) => state.allocations);
  const bookings = useAssetFlowStore((state) => state.bookings);
  const transfers = useAssetFlowStore((state) => state.transfers);
  const maintenance = useAssetFlowStore((state) => state.maintenance);

  return useMemo(() => {
    const overdueAllocations = allocations.filter(
      (allocation) => allocation.status === "Active" && daysOverdue(allocation.expected_return_date) > 0
    );

    return {
      assetsAvailable: assets.filter((asset) => asset.status === "Available").length,
      assetsAllocated: assets.filter((asset) => asset.status === "Allocated").length,
      maintenanceToday: maintenance.filter((request) => request.status === "In_Progress").length,
      activeBookings: bookings.filter((booking) => booking.status === "Upcoming").length,
      pendingTransfers: transfers.filter((transfer) => transfer.status === "Requested").length,
      upcomingReturns: allocations.filter((allocation) => allocation.status === "Active").length,
      overdueAllocations
    };
  }, [allocations, assets, bookings, maintenance, transfers]);
}
