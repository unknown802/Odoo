import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../lib/api";
import type { TransferRequest, MaintenanceRequest, Allocation, Booking, AuditCycle, ActivityLog, Profile, Department, AssetCategory } from "../types";

// ─── Org (bootstrap: departments + categories + profiles) ─────────────────────
export interface OrgData {
  departments: Department[];
  categories: AssetCategory[];
  profiles: Profile[];
}

export function useOrg() {
  return useQuery({
    queryKey: ["org"],
    queryFn: () => fetchApi<OrgData>("/api/org/bootstrap"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => fetchApi("/api/org/departments", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["org"] }),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/api/org/departments/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["org"] }),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => fetchApi("/api/org/categories", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["org"] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/api/org/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["org"] }),
  });
}

// ─── Transfers ────────────────────────────────────────────────────────────────
export function useTransfers() {
  return useQuery({
    queryKey: ["transfers"],
    queryFn: () => fetchApi<TransferRequest[]>("/api/transfers"),
  });
}

export function useApproveTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transferId: string) =>
      fetchApi(`/api/transfers/${transferId}/approve`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_summary"] });
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { asset_id: string; to_holder_id: string; notes?: string }) =>
      fetchApi("/api/transfers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_summary"] });
    },
  });
}

// ─── Allocations ──────────────────────────────────────────────────────────────
export function useAllocations() {
  return useQuery({
    queryKey: ["allocations"],
    queryFn: () => fetchApi<Allocation[]>("/api/allocations"),
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { asset_id: string; allocated_to_id: string; expected_return_date: string }) =>
      fetchApi("/api/allocations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_summary"] });
    },
  });
}

export function useReturnAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, return_condition, return_notes }: { id: string; return_condition: string; return_notes?: string }) =>
      fetchApi(`/api/allocations/${id}/return`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_condition, return_notes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_summary"] });
    },
  });
}

// ─── Maintenance ──────────────────────────────────────────────────────────────
export function useMaintenance() {
  return useQuery({
    queryKey: ["maintenance"],
    queryFn: () => fetchApi<MaintenanceRequest[]>("/api/maintenance"),
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { asset_id: string; title: string; description?: string; priority: string }) =>
      fetchApi("/api/maintenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_summary"] });
    },
  });
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; description?: string; priority?: string }) =>
      fetchApi(`/api/maintenance/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    },
  });
}

export function useDeleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/api/maintenance/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_summary"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useMoveMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" | "start" | "resolve" }) =>
      fetchApi(`/api/maintenance/${id}/${action}`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_summary"] });
    },
  });
}

// ─── Bookings ─────────────────────────────────────────────────────────────────
export function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: () => fetchApi<Booking[]>("/api/bookings"),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { resource_id: string; start_time: string; end_time: string; purpose?: string }) =>
      fetchApi("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; resource_id?: string; start_time?: string; end_time?: string; purpose?: string }) =>
      fetchApi(`/api/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) =>
      fetchApi(`/api/bookings/${bookingId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// ─── Audit Cycles ─────────────────────────────────────────────────────────────
export function useAuditCycles() {
  return useQuery({
    queryKey: ["audit_cycles"],
    queryFn: () => fetchApi<AuditCycle[]>("/api/audits"),
  });
}

export function useCreateAuditCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; scope_department_id?: string; scope_location?: string; start_date: string; auditor_ids: string[] }) =>
      fetchApi("/api/audits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit_cycles"] });
    },
  });
}

export function useUpdateAuditCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; scope_department_id?: string; scope_location?: string; auditor_ids?: string[] }) =>
      fetchApi(`/api/audits/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit_cycles"] });
    },
  });
}

export function useDeleteAuditCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/api/audits/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit_cycles"] });
    },
  });
}

export function useUpdateAuditItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cycleId, itemId, status, notes }: { cycleId: string; itemId: string; status: string; notes?: string }) =>
      fetchApi(`/api/audits/${cycleId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit_cycles"] });
    },
  });
}

export function useCloseAuditCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cycleId: string) =>
      fetchApi(`/api/audits/${cycleId}/close`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit_cycles"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

// ─── Activity Logs ────────────────────────────────────────────────────────────
export function useActivityLogs() {
  return useQuery({
    queryKey: ["activity_logs"],
    queryFn: () => fetchApi<ActivityLog[]>("/api/reports/activity"),
  });
}
