import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../lib/api";
import type { Asset } from "../types";

export interface PaginatedAssets {
  data: Asset[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface AssetFilters {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAssets(filters?: AssetFilters) {
  return useQuery({
    queryKey: ["assets", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== "All") params.append("status", filters.status);
      if (filters?.category && filters.category !== "All") params.append("category", filters.category);
      if (filters?.search?.trim()) params.append("search", filters.search.trim());
      if (filters?.page) params.append("page", String(filters.page));
      if (filters?.limit) params.append("limit", String(filters.limit));

      const queryString = params.toString();
      const result = await fetchApi<PaginatedAssets | Asset[]>(
        `/api/assets${queryString ? `?${queryString}` : ""}`
      );

      // Handle both paginated and non-paginated responses gracefully
      if (Array.isArray(result)) {
        return {
          data: result,
          meta: { total: result.length, page: 1, pageSize: result.length, totalPages: 1 },
        } as PaginatedAssets;
      }
      return result as PaginatedAssets;
    },
  });
}

/** Convenience hook for places that just need a flat array (e.g. dropdown selects) */
export function useAllAssets() {
  return useQuery({
    queryKey: ["assets", "all"],
    queryFn: () =>
      fetchApi<PaginatedAssets>("/api/assets?limit=500").then((r) => r.data),
    staleTime: 30_000,
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Asset>) =>
      fetchApi("/api/assets", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Asset>) =>
      fetchApi(`/api/assets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/api/assets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
