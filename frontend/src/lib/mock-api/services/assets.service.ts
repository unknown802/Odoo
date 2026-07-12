// @ts-nocheck
import { repo } from "../repository";
import type { Asset } from "../../../types";

export const assetsService = {
  getAll: (filters: { status?: string; category?: string; search?: string; page?: number; limit?: number }) => {
    let assets = repo.get("assets");
    
    if (filters.status && filters.status !== "All") {
      assets = assets.filter((a: any) => a.status === filters.status);
    }
    if (filters.category && filters.category !== "All") {
      assets = assets.filter((a: any) => a.category_id === filters.category);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      assets = assets.filter((a: any) => 
        a.name.toLowerCase().includes(q) || 
        a.asset_tag.toLowerCase().includes(q) || 
        (a.serial_number && a.serial_number.toLowerCase().includes(q))
      );
    }

    // Embed relations
    const categories = repo.get("categories");
    const departments = repo.get("departments");
    
    assets = assets.map((a: any) => ({
      ...a,
      category: categories.find((c: any) => c.id === a.category_id),
      department: departments.find((d: any) => d.id === a.current_department_id)
    }));

    // Sort by created_at desc
    assets.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = assets.length;
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const from = (page - 1) * limit;
    
    return {
      data: assets.slice(from, from + limit),
      meta: { total, page, pageSize: limit, totalPages: Math.ceil(total / limit) }
    };
  },

  getById: (id: string) => {
    const asset = repo.findById("assets", id);
    if (!asset) throw new Error("Asset not found");
    
    asset.category = repo.findById("categories", asset.category_id);
    asset.department = repo.findById("departments", asset.current_department_id);
    
    const allocations = repo.get("allocations").filter((a: any) => a.asset_id === id);
    const maintenance = repo.get("maintenanceRequests").filter((m: any) => m.asset_id === id);
    
    return { asset, allocations, maintenance };
  },

  create: (userId: string, data: Partial<Asset>) => {
    return repo.transaction((db) => {
      // Create asset
      const asset = {
        ...data,
        id: `asset-${Math.random().toString(36).substring(2, 10)}`,
        status: data.status || "Available",
        created_at: new Date().toISOString()
      };
      db.assets.unshift(asset);

      // Log activity
      db.activityLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 10)}`,
        user_id: userId,
        action: "Asset registered",
        entity_type: "asset",
        entity_id: asset.id,
        details: { asset_tag: asset.asset_tag },
        created_at: new Date().toISOString()
      });
      
      return asset;
    });
  },

  update: (userId: string, id: string, data: Partial<Asset>) => {
    return repo.transaction((db) => {
      const index = db.assets.findIndex(a => a.id === id);
      if (index === -1) throw new Error("Asset not found");
      
      const oldStatus = db.assets[index].status;
      db.assets[index] = { ...db.assets[index], ...data, updated_at: new Date().toISOString() };

      if (data.status && oldStatus !== data.status) {
        db.activityLogs.unshift({
          id: `log-${Math.random().toString(36).substring(2, 10)}`,
          user_id: userId,
          action: "Asset status updated",
          entity_type: "asset",
          entity_id: id,
          details: { from: oldStatus, to: data.status },
          created_at: new Date().toISOString()
        });
      }

      return db.assets[index];
    });
  },

  delete: (userId: string, id: string) => {
    return repo.transaction((db) => {
      const asset = db.assets.find(a => a.id === id);
      if (!asset) throw new Error("Asset not found");
      
      if (asset.status === "Allocated") {
        throw new Error("Cannot delete an allocated asset.");
      }

      db.assets = db.assets.filter(a => a.id !== id);
      
      db.activityLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 10)}`,
        user_id: userId,
        action: "Asset deleted",
        entity_type: "asset",
        entity_id: id,
        details: { name: asset.name },
        created_at: new Date().toISOString()
      });
    });
  }
};
