// @ts-nocheck
import { repo } from "../repository";

export const orgService = {
  getProfiles: () => repo.get("profiles"),
  getDepartments: () => repo.get("departments"),
  getCategories: () => repo.get("categories"),

  updateRole: (profileId: string, role: string) => {
    return repo.transaction((db) => {
      const profile = db.profiles.find(p => p.id === profileId);
      if (!profile) throw new Error("Profile not found");
      profile.role = role;
    });
  },

  createDepartment: (data: any) => {
    return repo.transaction((db) => {
      const dept = {
        ...data,
        id: `dept-${Math.random().toString(36).substring(2, 10)}`,
        status: "Active"
      };
      db.departments.unshift(dept);
      return dept;
    });
  },

  deleteDepartment: (id: string) => {
    return repo.transaction((db) => {
      db.departments = db.departments.filter(d => d.id !== id);
    });
  },

  createCategory: (data: any) => {
    return repo.transaction((db) => {
      const cat = {
        ...data,
        id: `cat-${Math.random().toString(36).substring(2, 10)}`,
        status: "Active"
      };
      db.categories.unshift(cat);
      return cat;
    });
  },

  deleteCategory: (id: string) => {
    return repo.transaction((db) => {
      db.categories = db.categories.filter(c => c.id !== id);
    });
  }
};
