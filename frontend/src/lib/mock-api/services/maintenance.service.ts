// @ts-nocheck
import { repo } from "../repository";
import type { MaintenanceRequest } from "../../../types";

export const maintenanceService = {
  getAll: () => {
    const data = repo.get("maintenanceRequests");
    data.sort((a: any, b: any) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
    return data;
  },

  create: (userId: string, data: Partial<MaintenanceRequest>) => {
    return repo.transaction((db) => {
      const asset = db.assets.find(a => a.id === data.asset_id);
      if (!asset) throw new Error("Asset not found");

      const req = {
        ...data,
        id: `maint-${Math.random().toString(36).substring(2, 10)}`,
        requested_by_id: userId,
        status: "Pending",
        requested_at: new Date().toISOString()
      };
      db.maintenanceRequests.unshift(req);

      // Asset goes under maintenance immediately upon request
      asset.status = "Under_Maintenance";
      
      // If it was allocated, clear the holder? (Usually yes for enterprise, or keep them as holder but status is maintenance. We will clear it)
      const oldAlloc = db.allocations.find(a => a.asset_id === asset.id && a.status === "Active");
      if (oldAlloc) {
        oldAlloc.status = "Returned";
        oldAlloc.returned_at = new Date().toISOString();
        oldAlloc.return_condition = "Maintenance_Required";
      }
      asset.current_holder_id = null;

      db.activityLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 10)}`,
        user_id: userId,
        action: "Maintenance requested",
        entity_type: "maintenance_request",
        entity_id: req.id,
        details: { priority: req.priority },
        created_at: new Date().toISOString()
      });

      return req;
    });
  },

  update: (userId: string, id: string, payload: Partial<MaintenanceRequest>) => {
    return repo.transaction((db) => {
      const req = db.maintenanceRequests.find(m => m.id === id);
      if (!req) throw new Error("Maintenance request not found");
      Object.assign(req, payload);
      return req;
    });
  },

  delete: (userId: string, id: string) => {
    return repo.transaction((db) => {
      const index = db.maintenanceRequests.findIndex(m => m.id === id);
      if (index === -1) throw new Error("Maintenance request not found");
      const req = db.maintenanceRequests[index];
      db.maintenanceRequests.splice(index, 1);
      
      const asset = db.assets.find(a => a.id === req.asset_id);
      if (asset && req.status !== "Resolved") {
         asset.status = "Available"; // revert to available if we delete a pending/in_progress req
      }
    });
  },

  moveStatus: (userId: string, id: string, action: "approve" | "reject" | "start" | "resolve") => {
    return repo.transaction((db) => {
      const req = db.maintenanceRequests.find(m => m.id === id);
      if (!req) throw new Error("Maintenance request not found");
      const asset = db.assets.find(a => a.id === req.asset_id);

      let newStatus = req.status;
      if (action === "approve") {
        newStatus = "Approved";
        req.approved_by_id = userId;
      }
      if (action === "start") newStatus = "In_Progress";
      if (action === "resolve") {
        newStatus = "Resolved";
        if (asset) asset.status = "Available"; // Asset is back online
      }
      if (action === "reject") {
        newStatus = "Resolved"; // Close it
        if (asset) asset.status = "Available"; // Assume it didn't actually need it
      }

      const oldStatus = req.status;
      req.status = newStatus;

      db.activityLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 10)}`,
        user_id: userId,
        action: "Maintenance status updated",
        entity_type: "maintenance_request",
        entity_id: req.id,
        details: { from: oldStatus, to: newStatus },
        created_at: new Date().toISOString()
      });

      return req;
    });
  }
};
