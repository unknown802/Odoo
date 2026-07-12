import { generateSeedData } from "./seed";
import type { Department, Profile, AssetCategory, Asset, Allocation, MaintenanceRequest, Booking, AuditCycle, TransferRequest, ActivityLog, NotificationItem } from "../../types";

const DB_KEY = "assetflow_mock_db_v3";

export interface MockDatabase {
  departments: Department[];
  profiles: Profile[];
  categories: AssetCategory[];
  assets: Asset[];
  allocations: Allocation[];
  maintenanceRequests: MaintenanceRequest[];
  bookings: Booking[];
  auditCycles: AuditCycle[];
  transfers: TransferRequest[];
  activityLogs: ActivityLog[];
  notifications: NotificationItem[];
}

// 1. Initialize or get database
function getDb(): MockDatabase {
  const existing = localStorage.getItem(DB_KEY);
  if (existing) return JSON.parse(existing);
  
  const initial = generateSeedData();
  localStorage.setItem(DB_KEY, JSON.stringify(initial));
  return initial as MockDatabase;
}

function saveDb(db: MockDatabase) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// 2. Generic Repository operations
export const repo = {
  get: <T extends keyof MockDatabase>(table: T): MockDatabase[T] => {
    return getDb()[table] || [];
  },

  findById: <T extends keyof MockDatabase>(table: T, id: string): any => {
    return getDb()[table].find((item: any) => item.id === id);
  },

  insert: <T extends keyof MockDatabase>(table: T, record: any): any => {
    const db = getDb();
    const newRecord = { ...record };
    if (!newRecord.id) {
      newRecord.id = `${table.slice(0, -1)}-${Math.random().toString(36).substring(2, 10)}`;
    }
    if (!newRecord.created_at) {
      newRecord.created_at = new Date().toISOString();
    }
    db[table].unshift(newRecord);
    saveDb(db);
    return newRecord;
  },

  update: <T extends keyof MockDatabase>(table: T, id: string, payload: any): any => {
    const db = getDb();
    const index = db[table].findIndex((item: any) => item.id === id);
    if (index === -1) throw new Error(`${table} record not found`);
    
    db[table][index] = { ...db[table][index], ...payload, updated_at: new Date().toISOString() };
    saveDb(db);
    return db[table][index];
  },

  remove: <T extends keyof MockDatabase>(table: T, id: string): void => {
    const db = getDb();
    db[table] = db[table].filter((item: any) => item.id !== id) as any;
    saveDb(db);
  },

  // Helper for batch transaction-like updates
  transaction: (callback: (db: MockDatabase) => void) => {
    const db = getDb();
    callback(db);
    saveDb(db);
  }
};
