import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../lib/api";
import type { Allocation } from "../types";

export interface DashboardSummary {
  assetsAvailable: number;
  assetsAllocated: number;
  maintenanceToday: number;
  activeBookings: number;
  pendingTransfers: number;
  upcomingReturns: number;
  overdueAllocations: (Allocation & {
    asset: { name: string; asset_tag: string };
    holder: { full_name: string };
  })[];
}

export interface DashboardAnalytics {
  statusCounts: Record<string, number>;
  deptCounts: Record<string, number>;
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard_summary"],
    queryFn: async () => {
      const summary: any = await fetchApi("/api/reports/summary");
      summary.upcomingReturns = summary.activeAllocations;
      return summary as DashboardSummary;
    }
  });
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ["dashboard_analytics"],
    queryFn: async () => {
      return fetchApi<DashboardAnalytics>("/api/reports/analytics");
    }
  });
}
