// @ts-nocheck
import { repo } from "../repository";
import type { AuditCycle, AuditItem } from "../../../types";

export const auditsService = {
  getAll: () => {
    const data = repo.get("auditCycles");
    data.sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    return data;
  },

  create: (userId: string, data: Partial<AuditCycle>) => {
    return repo.transaction((db) => {
      // Find all assets in scope
      let scopeAssets = db.assets;
      if (data.scope_department_id) {
        scopeAssets = scopeAssets.filter(a => a.current_department_id === data.scope_department_id);
      }
      if (data.scope_location) {
        scopeAssets = scopeAssets.filter(a => a.location === data.scope_location);
      }

      const cycle = {
        ...data,
        id: `audit-${Math.random().toString(36).substring(2, 10)}`,
        created_by_id: userId,
        status: "In_Progress",
        items: scopeAssets.map(a => ({
          id: `aitem-${Math.random().toString(36).substring(2, 10)}`,
          audit_cycle_id: `audit-xxx`, // fixed below
          asset_id: a.id,
          auditor_id: data.auditor_ids?.[0] || userId,
          status: "Pending",
          notes: ""
        }))
      };
      
      // Fix IDs
      cycle.items.forEach(i => i.audit_cycle_id = cycle.id);

      db.auditCycles.unshift(cycle);

      db.activityLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 10)}`,
        user_id: userId,
        action: "Audit cycle started",
        entity_type: "audit_cycle",
        entity_id: cycle.id,
        details: { title: cycle.title, scope_count: cycle.items.length },
        created_at: new Date().toISOString()
      });

      return cycle;
    });
  },

  update: (userId: string, id: string, data: any) => {
    return repo.transaction((db) => {
      const cycle = db.auditCycles.find((c) => c.id === id);
      if (!cycle) throw new Error("Audit cycle not found");
      Object.assign(cycle, data);
      return cycle;
    });
  },

  delete: (userId: string, id: string) => {
    return repo.transaction((db) => {
      db.auditCycles = db.auditCycles.filter(c => c.id !== id);
    });
  },

  updateItem: (userId: string, cycleId: string, itemId: string, payload: Partial<AuditItem>) => {
    return repo.transaction((db) => {
      const cycle = db.auditCycles.find(c => c.id === cycleId);
      if (!cycle) throw new Error("Audit cycle not found");
      
      const item = cycle.items.find((i: any) => i.id === itemId);
      if (!item) throw new Error("Audit item not found");

      Object.assign(item, payload);

      // If marked as missing or damaged, create an activity log and optionally a maintenance request
      if (payload.status === "Damaged") {
         const asset = db.assets.find(a => a.id === item.asset_id);
         if (asset && asset.status !== "Under_Maintenance") {
           asset.status = "Under_Maintenance";
           db.maintenanceRequests.unshift({
              id: `maint-${Math.random().toString(36).substring(2, 10)}`,
              asset_id: asset.id,
              requested_by_id: userId,
              title: `Audit Report: Damaged Asset`,
              description: `Found damaged during audit ${cycle.title}. Notes: ${payload.notes}`,
              priority: "High",
              status: "Pending",
              requested_at: new Date().toISOString()
           });
         }
      }

      if (payload.status === "Missing") {
         const asset = db.assets.find(a => a.id === item.asset_id);
         if (asset) asset.status = "Lost";
      }
    });
  },

  closeCycle: (userId: string, cycleId: string) => {
    return repo.transaction((db) => {
      const cycle = db.auditCycles.find(c => c.id === cycleId);
      if (!cycle) throw new Error("Audit cycle not found");
      
      cycle.status = "Closed";

      db.activityLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 10)}`,
        user_id: userId,
        action: "Audit cycle closed",
        entity_type: "audit_cycle",
        entity_id: cycle.id,
        details: { title: cycle.title },
        created_at: new Date().toISOString()
      });
    });
  }
};
