import { repo } from "../repository";

export const reportsService = {
  getSummary: () => {
    const assets = repo.get("assets");
    const allocations = repo.get("allocations");
    const maintenance = repo.get("maintenanceRequests");
    const bookings = repo.get("bookings");
    const transfers = repo.get("transfers");
    const profiles = repo.get("profiles");

    const now = new Date();

    const assetsAvailable = assets.filter(a => a.status === "Available").length;
    const assetsAllocated = assets.filter(a => a.status === "Allocated").length;
    const maintenanceToday = maintenance.filter(m => m.status === "Pending" || m.status === "In_Progress").length;
    const activeBookings = bookings.filter(b => b.status === "Ongoing").length;
    const pendingTransfers = transfers.filter(t => t.status === "Requested").length;

    // Overdue returns
    const overdueAllocations = allocations
      .filter(a => a.status === "Active" && a.expected_return_date && new Date(a.expected_return_date) < now)
      .map(a => {
        const asset = assets.find(ast => ast.id === a.asset_id);
        const holder = profiles.find(p => p.id === a.allocated_to_id);
        return {
          ...a,
          asset: { name: asset?.name || "Unknown", asset_tag: asset?.asset_tag || "Unknown" },
          holder: { full_name: holder?.full_name || "Unknown" }
        };
      });

    return {
      assetsAvailable,
      assetsAllocated,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      upcomingReturns: allocations.filter(a => a.status === "Active").length,
      overdueAllocations
    };
  },

  getAnalytics: () => {
    const assets = repo.get("assets");
    const profiles = repo.get("profiles");
    
    const statusCounts: Record<string, number> = {};
    assets.forEach(a => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });

    const deptCounts: Record<string, number> = {};
    assets.forEach(a => {
      if (a.current_department_id) {
        deptCounts[a.current_department_id] = (deptCounts[a.current_department_id] || 0) + 1;
      } else if (a.current_holder_id) {
        const p = profiles.find(pr => pr.id === a.current_holder_id);
        if (p?.department_id) {
          deptCounts[p.department_id] = (deptCounts[p.department_id] || 0) + 1;
        }
      }
    });

    return { statusCounts, deptCounts };
  },

  getRecentActivity: () => {
    return repo.get("activityLogs").slice(0, 10);
  },
  
  getNotifications: () => {
    return repo.get("notifications").slice(0, 10); // Or filter by user
  }
};
