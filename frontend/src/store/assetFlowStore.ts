import { create } from "zustand";
import {
  activityLogs as seededActivityLogs,
  allocations as seededAllocations,
  assets as seededAssets,
  auditCycles as seededAuditCycles,
  bookings as seededBookings,
  categories as seededCategories,
  departments as seededDepartments,
  maintenanceRequests as seededMaintenance,
  notifications as seededNotifications,
  profiles as seededProfiles,
  transferRequests as seededTransfers
} from "../lib/mockData";
import { isOverlapping, nextAssetTag } from "../lib/utils";
import type {
  ActivityLog,
  Allocation,
  Asset,
  AssetCategory,
  AuditCycle,
  Booking,
  Condition,
  Department,
  MaintenanceRequest,
  NotificationItem,
  Profile,
  Role,
  TransferRequest,
  ViewKey
} from "../types";

type ActionResult = { ok: boolean; message: string };

interface AssetFlowState {
  activeView: ViewKey;
  currentUserId: string;
  currentRole: Role;
  departments: Department[];
  categories: AssetCategory[];
  profiles: Profile[];
  assets: Asset[];
  allocations: Allocation[];
  bookings: Booking[];
  maintenance: MaintenanceRequest[];
  transfers: TransferRequest[];
  auditCycles: AuditCycle[];
  notifications: NotificationItem[];
  activityLogs: ActivityLog[];
  setActiveView: (view: ViewKey) => void;
  setCurrentRole: (role: Role) => void;
  registerAsset: (asset: Omit<Asset, "id" | "asset_tag" | "status" | "photos" | "documents" | "created_at">) => ActionResult;
  allocateAsset: (assetId: string, userId: string, expectedReturnDate: string) => ActionResult;
  returnAllocation: (allocationId: string, condition: Condition, notes: string) => ActionResult;
  requestTransfer: (assetId: string, toUserId: string, notes: string) => ActionResult;
  approveTransfer: (transferId: string) => ActionResult;
  createBooking: (booking: Omit<Booking, "id" | "booked_by_id" | "status">) => ActionResult;
  cancelBooking: (bookingId: string) => void;
  createMaintenance: (request: Omit<MaintenanceRequest, "id" | "requested_by_id" | "photos" | "status" | "requested_at">) => ActionResult;
  moveMaintenance: (requestId: string, status: MaintenanceRequest["status"], notes?: string) => ActionResult;
  createAuditCycle: (cycle: Omit<AuditCycle, "id" | "status" | "created_by_id" | "items">) => ActionResult;
  updateAuditItem: (cycleId: string, itemId: string, status: AuditCycle["items"][number]["status"], notes?: string) => void;
  closeAuditCycle: (cycleId: string) => ActionResult;
  getAuditSummary: () => {
    total: number;
    verified: number;
    pending: number;
    missing: number;
    damaged: number;
  };
  markAllNotificationsRead: () => void;
}

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;

const addLog = (state: AssetFlowState, action: string, entity_type: string, entity_id?: string, details: Record<string, unknown> = {}) => ({
  id: id("log"),
  user_id: state.currentUserId,
  action,
  entity_type,
  entity_id,
  details,
  created_at: new Date().toISOString()
});

export const useAssetFlowStore = create<AssetFlowState>((set, get) => ({
  activeView: "dashboard",
  currentUserId: "user-admin",
  currentRole: "Admin",
  departments: seededDepartments,
  categories: seededCategories,
  profiles: seededProfiles,
  assets: seededAssets,
  allocations: seededAllocations,
  bookings: seededBookings,
  maintenance: seededMaintenance,
  transfers: seededTransfers,
  auditCycles: seededAuditCycles,
  notifications: seededNotifications,
  activityLogs: seededActivityLogs,
  setActiveView: (activeView) => set({ activeView }),
  setCurrentRole: (currentRole) => {
    const profile =
      get().profiles.find((candidate) => candidate.role === currentRole) ??
      get().profiles.find((candidate) => candidate.role === "Employee")!;
    set({ currentRole, currentUserId: profile.id });
  },
  registerAsset: (asset) => {
    const state = get();
    const next: Asset = {
      ...asset,
      id: id("asset"),
      asset_tag: nextAssetTag(state.assets.length),
      status: "Available",
      photos: [],
      documents: [],
      created_at: new Date().toISOString()
    };

    set({
      assets: [next, ...state.assets],
      activityLogs: [addLog(state, "Asset registered", "asset", next.id, { asset_tag: next.asset_tag }), ...state.activityLogs]
    });
    return { ok: true, message: `${next.asset_tag} registered.` };
  },
  allocateAsset: (assetId, userId, expectedReturnDate) => {
    const state = get();
    const asset = state.assets.find((candidate) => candidate.id === assetId);
    const profile = state.profiles.find((candidate) => candidate.id === userId);

    if (!asset || !profile) return { ok: false, message: "Select a valid asset and employee." };
    if (asset.status === "Allocated") return { ok: false, message: `${asset.asset_tag} is already allocated. Create a transfer request instead.` };
    if (asset.status === "Under_Maintenance") return { ok: false, message: `${asset.asset_tag} is under maintenance.` };
    if (["Lost", "Retired", "Disposed"].includes(asset.status)) return { ok: false, message: `${asset.asset_tag} is not allocatable.` };

    const allocation: Allocation = {
      id: id("alloc"),
      asset_id: assetId,
      allocated_to_id: userId,
      allocated_to_department_id: profile.department_id,
      allocated_by_id: state.currentUserId,
      allocated_at: new Date().toISOString(),
      expected_return_date: expectedReturnDate,
      status: "Active"
    };

    const notification: NotificationItem = {
      id: id("note"),
      user_id: userId,
      type: "Asset_Assigned",
      title: "New Asset Assigned",
      message: `${asset.name} (${asset.asset_tag}) has been assigned to you.`,
      is_read: false,
      created_at: new Date().toISOString()
    };

    set({
      allocations: [allocation, ...state.allocations],
      assets: state.assets.map((candidate) =>
        candidate.id === assetId
          ? { ...candidate, status: "Allocated", current_holder_id: userId, current_department_id: profile.department_id }
          : candidate
      ),
      notifications: [notification, ...state.notifications],
      activityLogs: [addLog(state, "Asset allocated", "asset_allocation", allocation.id, { asset_id: assetId }), ...state.activityLogs]
    });

    return { ok: true, message: `${asset.asset_tag} allocated to ${profile.full_name}.` };
  },
  returnAllocation: (allocationId, condition, notes) => {
    const state = get();
    const allocation = state.allocations.find((candidate) => candidate.id === allocationId);
    if (!allocation) return { ok: false, message: "Allocation not found." };

    set({
      allocations: state.allocations.map((candidate) =>
        candidate.id === allocationId
          ? { ...candidate, status: "Returned", returned_at: new Date().toISOString(), return_condition: condition, return_notes: notes }
          : candidate
      ),
      assets: state.assets.map((asset) =>
        asset.id === allocation.asset_id
          ? { ...asset, status: "Available", current_holder_id: null, current_department_id: null, condition }
          : asset
      ),
      activityLogs: [addLog(state, "Asset returned", "asset_allocation", allocationId, { condition }), ...state.activityLogs]
    });

    return { ok: true, message: "Asset returned and marked available." };
  },
  requestTransfer: (assetId, toUserId, notes) => {
    const state = get();
    const asset = state.assets.find((candidate) => candidate.id === assetId);
    if (!asset) return { ok: false, message: "Asset not found." };

    const transfer: TransferRequest = {
      id: id("transfer"),
      asset_id: assetId,
      from_holder_id: asset.current_holder_id,
      to_holder_id: toUserId,
      requested_by_id: state.currentUserId,
      status: "Requested",
      requested_at: new Date().toISOString(),
      notes
    };

    set({
      transfers: [transfer, ...state.transfers],
      activityLogs: [addLog(state, "Transfer requested", "transfer_request", transfer.id), ...state.activityLogs]
    });

    return { ok: true, message: "Transfer request created." };
  },
  approveTransfer: (transferId) => {
    const state = get();
    const transfer = state.transfers.find((candidate) => candidate.id === transferId);
    if (!transfer) return { ok: false, message: "Transfer not found." };
    const profile = state.profiles.find((candidate) => candidate.id === transfer.to_holder_id);
    if (!profile) return { ok: false, message: "Target holder not found." };

    const allocation: Allocation = {
      id: id("alloc"),
      asset_id: transfer.asset_id,
      allocated_to_id: transfer.to_holder_id,
      allocated_to_department_id: profile.department_id,
      allocated_by_id: state.currentUserId,
      allocated_at: new Date().toISOString(),
      status: "Active"
    };

    set({
      transfers: state.transfers.map((candidate) =>
        candidate.id === transferId ? { ...candidate, status: "Completed", approved_by_id: state.currentUserId } : candidate
      ),
      allocations: [
        allocation,
        ...state.allocations.map((candidate) =>
          candidate.asset_id === transfer.asset_id && candidate.status === "Active"
            ? { ...candidate, status: "Transferred" as const, returned_at: new Date().toISOString() }
            : candidate
        )
      ],
      assets: state.assets.map((asset) =>
        asset.id === transfer.asset_id
          ? { ...asset, status: "Allocated", current_holder_id: transfer.to_holder_id, current_department_id: profile.department_id }
          : asset
      ),
      notifications: [
        {
          id: id("note"),
          user_id: transfer.to_holder_id,
          type: "Transfer_Approved",
          title: "Transfer approved",
          message: "An asset has been transferred to you.",
          is_read: false,
          created_at: new Date().toISOString()
        },
        ...state.notifications
      ],
      activityLogs: [addLog(state, "Transfer approved", "transfer_request", transfer.id), ...state.activityLogs]
    });

    return { ok: true, message: "Transfer completed and asset re-allocated." };
  },
  createBooking: (booking) => {
    const state = get();
    const resource = state.assets.find((asset) => asset.id === booking.resource_id);
    if (!resource?.is_bookable) return { ok: false, message: "Select a bookable resource." };
    if (["Under_Maintenance", "Lost", "Retired", "Disposed"].includes(resource.status)) return { ok: false, message: "Resource is not bookable right now." };

    const conflicts = state.bookings.filter(
      (candidate) =>
        candidate.resource_id === booking.resource_id &&
        candidate.status !== "Cancelled" &&
        isOverlapping(candidate.start_time, candidate.end_time, booking.start_time, booking.end_time)
    );

    if (conflicts.length) return { ok: false, message: "Booking conflict detected for this time slot." };

    const next: Booking = {
      ...booking,
      id: id("booking"),
      booked_by_id: state.currentUserId,
      status: "Upcoming"
    };

    set({
      bookings: [next, ...state.bookings],
      notifications: [
        {
          id: id("note"),
          user_id: state.currentUserId,
          type: "Booking_Confirmed",
          title: "Booking confirmed",
          message: `${resource.name} is reserved.`,
          is_read: false,
          created_at: new Date().toISOString()
        },
        ...state.notifications
      ],
      activityLogs: [addLog(state, "Resource booked", "resource_booking", next.id), ...state.activityLogs]
    });

    return { ok: true, message: "Booking confirmed." };
  },
  cancelBooking: (bookingId) =>
    set((state) => ({
      bookings: state.bookings.map((booking) => (booking.id === bookingId ? { ...booking, status: "Cancelled" } : booking)),
      activityLogs: [addLog(state, "Booking cancelled", "resource_booking", bookingId), ...state.activityLogs]
    })),
  createMaintenance: (request) => {
    const state = get();
    const next: MaintenanceRequest = {
      ...request,
      id: id("maint"),
      requested_by_id: state.currentUserId,
      photos: [],
      status: "Pending",
      requested_at: new Date().toISOString()
    };

    set({
      maintenance: [next, ...state.maintenance],
      activityLogs: [addLog(state, "Maintenance requested", "maintenance_request", next.id, { priority: next.priority }), ...state.activityLogs]
    });

    return { ok: true, message: "Maintenance request raised." };
  },
  moveMaintenance: (requestId, status, notes) => {
    const state = get();
    const request = state.maintenance.find((candidate) => candidate.id === requestId);
    if (!request) return { ok: false, message: "Maintenance request not found." };

    set({
      maintenance: state.maintenance.map((candidate) =>
        candidate.id === requestId ? { ...candidate, status, approved_by_id: state.currentUserId, resolution_notes: notes ?? candidate.resolution_notes } : candidate
      ),
      assets: state.assets.map((asset) =>
        asset.id === request.asset_id
          ? { ...asset, status: status === "Resolved" ? "Available" : status === "Approved" || status === "In_Progress" ? "Under_Maintenance" : asset.status }
          : asset
      ),
      notifications: [
        {
          id: id("note"),
          user_id: request.requested_by_id,
          type: status === "Resolved" ? "Maintenance_Resolved" : "Maintenance_Approved",
          title: `Maintenance ${status.replace("_", " ")}`,
          message: request.title,
          is_read: false,
          created_at: new Date().toISOString()
        },
        ...state.notifications
      ],
      activityLogs: [addLog(state, `Maintenance ${status}`, "maintenance_request", requestId), ...state.activityLogs]
    });

    return { ok: true, message: `Maintenance moved to ${status.replace("_", " ")}.` };
  },
  createAuditCycle: (cycle) => {
    const state = get();

    const scopedAssets = state.assets.filter((asset) => {
      const deptMatch = !cycle.scope_department_id || asset.current_department_id === cycle.scope_department_id;

      const locationMatch = !cycle.scope_location || asset.location.toLowerCase().includes(cycle.scope_location.toLowerCase());

      return deptMatch && locationMatch;
    });

    if (scopedAssets.length === 0) {
      return {
        ok: false,
        message: "No assets found for the selected scope."
      };
    }

    const cycleId = id("audit");

    const next: AuditCycle = {
      ...cycle,
      id: cycleId,
      status: "In_Progress",
      created_by_id: state.currentUserId,

      items: scopedAssets.map((asset) => ({
        id: id("audit-item"),
        audit_cycle_id: cycleId,
        asset_id: asset.id,
        auditor_id: cycle.auditor_ids[0] ?? null,
        status: "Pending",
        notes: "",
        verified_at: null
      }))
    };

    set({
      auditCycles: [next, ...state.auditCycles],

      activityLogs: [
        addLog(
          state,
          "Audit Cycle Created",
          "audit_cycle",
          next.id,
          {
            total_assets: next.items.length
          }
        ),
        ...state.activityLogs
      ]
    });

    return {
      ok: true,
      message: `Audit created with ${next.items.length} assets.`
    };
  },
  updateAuditItem: (cycleId, itemId, status, notes) =>
    set((state) => ({
      auditCycles: state.auditCycles.map((cycle) =>
        cycle.id === cycleId
          ? {
              ...cycle,
              items: cycle.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      status,
                      notes,
                      verified_at: status === "Pending" ? null : new Date().toISOString()
                    }
                  : item
              )
            }
          : cycle
      ),

      activityLogs: [
        addLog(
          state,
          "Audit Updated",
          "audit_item",
          itemId,
          {
            status
          }
        ),
        ...state.activityLogs
      ]
    })),
  closeAuditCycle: (cycleId) => {
    const state = get();

    const cycle = state.auditCycles.find((c) => c.id === cycleId);

    if (!cycle) {
      return {
        ok: false,
        message: "Audit cycle not found."
      };
    }

    const missingAssets = cycle.items.filter((item) => item.status === "Missing");

    const damagedAssets = cycle.items.filter((item) => item.status === "Damaged");

    set({
      auditCycles: state.auditCycles.map((cycle) =>
        cycle.id === cycleId
          ? {
              ...cycle,
              status: "Closed",
              end_date: new Date().toISOString().slice(0, 10)
            }
          : cycle
      ),

      assets: state.assets.map((asset) => {
        if (missingAssets.some((m) => m.asset_id === asset.id)) {
          return {
            ...asset,
            status: "Lost"
          };
        }

        if (damagedAssets.some((m) => m.asset_id === asset.id)) {
          return {
            ...asset,
            condition: "Damaged"
          };
        }

        return asset;
      }),

      notifications: [
        {
          id: id("note"),
          user_id: state.currentUserId,
          type: "Audit_Completed",
          title: "Audit Closed",

          message: `${missingAssets.length} Missing | ${damagedAssets.length} Damaged`,

          is_read: false,

          created_at: new Date().toISOString()
        },

        ...state.notifications
      ],

      activityLogs: [
        addLog(
          state,
          "Audit Closed",
          "audit_cycle",
          cycleId,
          {
            missing: missingAssets.length,
            damaged: damagedAssets.length
          }
        ),

        ...state.activityLogs
      ]
    });

    return {
      ok: true,
      message: "Audit completed successfully."
    };
  },
  getAuditSummary: () => {
    const items: Array<AuditCycle["items"][number]> = [];

    for (const cycle of get().auditCycles) {
      items.push(...cycle.items);
    }

    return {
      total: items.length,

      verified: items.filter((i) => i.status === "Verified").length,

      pending: items.filter((i) => i.status === "Pending").length,

      missing: items.filter((i) => i.status === "Missing").length,

      damaged: items.filter((i) => i.status === "Damaged").length
    };
  },
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({ ...notification, is_read: true }))
    }))
}));
