// @ts-nocheck
import { repo } from "../repository";
import type { Allocation, TransferRequest } from "../../../types";

export const allocationsService = {
  getAll: () => {
    let allocs = repo.get("allocations");
    allocs.sort((a: any, b: any) => new Date(b.allocated_at).getTime() - new Date(a.allocated_at).getTime());
    return allocs;
  },

  create: (userId: string, data: Partial<Allocation>) => {
    return repo.transaction((db) => {
      const asset = db.assets.find(a => a.id === data.asset_id);
      if (!asset) throw new Error("Asset not found");
      if (asset.status === "Allocated") throw new Error("Asset is already allocated");
      if (asset.status === "Under_Maintenance") throw new Error("Asset is under maintenance");

      const profile = db.profiles.find(p => p.id === data.allocated_to_id);

      // Create Allocation
      const allocation = {
        ...data,
        id: `alloc-${Math.random().toString(36).substring(2, 10)}`,
        allocated_to_department_id: profile?.department_id,
        allocated_by_id: userId,
        allocated_at: new Date().toISOString(),
        status: "Active"
      };
      db.allocations.unshift(allocation);

      // Update Asset Status
      asset.status = "Allocated";
      asset.current_holder_id = data.allocated_to_id;
      asset.current_department_id = profile?.department_id;

      // Activity Log
      db.activityLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 10)}`,
        user_id: userId,
        action: "Asset allocated",
        entity_type: "allocation",
        entity_id: allocation.id,
        details: { to: profile?.full_name, asset: asset.name },
        created_at: new Date().toISOString()
      });

      // Generate Notification to the user
      db.notifications.unshift({
        id: `notif-${Math.random().toString(36).substring(2, 10)}`,
        user_id: data.allocated_to_id,
        type: "System",
        title: "Asset Assigned",
        message: `${asset.name} has been assigned to you.`,
        is_read: false,
        created_at: new Date().toISOString()
      });

      return allocation;
    });
  },

  returnAsset: (userId: string, id: string, returnData: { return_condition: string; return_notes?: string }) => {
    return repo.transaction((db) => {
      const allocIndex = db.allocations.findIndex(a => a.id === id);
      if (allocIndex === -1) throw new Error("Allocation not found");
      
      const allocation = db.allocations[allocIndex];
      if (allocation.status !== "Active") throw new Error("Allocation is already returned");

      const asset = db.assets.find(a => a.id === allocation.asset_id);
      
      // Update Allocation
      db.allocations[allocIndex] = {
        ...allocation,
        status: "Returned",
        returned_at: new Date().toISOString(),
        return_condition: returnData.return_condition,
        return_notes: returnData.return_notes
      };

      // Handle Asset Status
      if (returnData.return_condition === "Damaged" || returnData.return_condition === "Poor") {
        asset.status = "Under_Maintenance";
        asset.current_holder_id = null;

        // Auto-create Maintenance Request
        const maintReq = {
          id: `maint-${Math.random().toString(36).substring(2, 10)}`,
          asset_id: asset.id,
          requested_by_id: userId,
          title: `Auto-generated: Damaged return (${asset.asset_tag})`,
          description: `Returned in ${returnData.return_condition} condition. Notes: ${returnData.return_notes || "None"}`,
          priority: returnData.return_condition === "Damaged" ? "High" : "Medium",
          status: "Pending",
          requested_at: new Date().toISOString()
        };
        db.maintenanceRequests.unshift(maintReq);

        db.activityLogs.unshift({
          id: `log-${Math.random().toString(36).substring(2, 10)}`,
          user_id: userId,
          action: "Maintenance auto-created",
          entity_type: "maintenance_request",
          entity_id: maintReq.id,
          details: { reason: "Damaged return" },
          created_at: new Date().toISOString()
        });

      } else {
        asset.status = "Available";
        asset.current_holder_id = null;
      }

      db.activityLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 10)}`,
        user_id: userId,
        action: "Asset returned",
        entity_type: "allocation",
        entity_id: allocation.id,
        details: { condition: returnData.return_condition },
        created_at: new Date().toISOString()
      });
    });
  },
  
  createTransfer: (userId: string, data: Partial<TransferRequest>) => {
    return repo.transaction((db) => {
      const asset = db.assets.find(a => a.id === data.asset_id);
      if (!asset) throw new Error("Asset not found");
      
      const transfer = {
        ...data,
        id: `transfer-${Math.random().toString(36).substring(2, 10)}`,
        from_holder_id: asset.current_holder_id,
        requested_by_id: userId,
        status: "Requested",
        requested_at: new Date().toISOString()
      };
      
      db.transfers.unshift(transfer);
      return transfer;
    });
  },
  
  approveTransfer: (userId: string, id: string) => {
    return repo.transaction((db) => {
      const transfer = db.transfers.find(t => t.id === id);
      if (!transfer) throw new Error("Transfer not found");
      if (transfer.status !== "Requested") throw new Error("Transfer is not in requested state");
      
      transfer.status = "Approved";
      
      const asset = db.assets.find(a => a.id === transfer.asset_id);
      
      // Close old allocation if exists
      const oldAlloc = db.allocations.find(a => a.asset_id === asset.id && a.status === "Active");
      if (oldAlloc) {
        oldAlloc.status = "Returned";
        oldAlloc.returned_at = new Date().toISOString();
      }
      
      // Create new allocation
      const profile = db.profiles.find(p => p.id === transfer.to_holder_id);
      db.allocations.unshift({
        id: `alloc-${Math.random().toString(36).substring(2, 10)}`,
        asset_id: asset.id,
        allocated_to_id: profile.id,
        allocated_to_department_id: profile.department_id,
        allocated_by_id: userId,
        allocated_at: new Date().toISOString(),
        expected_return_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: "Active"
      });
      
      asset.current_holder_id = profile.id;
      asset.current_department_id = profile.department_id;
      
      db.activityLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 10)}`,
        user_id: userId,
        action: "Transfer approved",
        entity_type: "transfer_request",
        entity_id: transfer.id,
        details: {},
        created_at: new Date().toISOString()
      });
    });
  },
  
  getTransfers: () => {
    const transfers = repo.get("transfers");
    const assets = repo.get("assets");
    return transfers;
  }
};
