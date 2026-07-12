import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAssetFlowStore } from "../store/assetFlowStore";
import type { Asset } from "../types";

export function useAssets(filters?: { status?: string; search?: string }) {
  const demoAssets = useAssetFlowStore((state) => state.assets);

  return useQuery({
    queryKey: ["assets", filters, demoAssets],
    queryFn: async () => {
      if (!supabase) {
        return demoAssets.filter((asset) => {
          const statusMatch = !filters?.status || filters.status === "All" || asset.status === filters.status;
          const search = filters?.search?.toLowerCase() ?? "";
          const searchMatch =
            !search ||
            [asset.name, asset.asset_tag, asset.serial_number ?? "", asset.location].some((value) => value.toLowerCase().includes(search));
          return statusMatch && searchMatch;
        });
      }

      let query = supabase.from("assets").select("*, category:asset_categories(*), holder:profiles(full_name)");
      if (filters?.status && filters.status !== "All") query = query.eq("status", filters.status);
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,asset_tag.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`);
      }
      const { data, error } = await query.returns<Asset[]>();
      if (error) throw error;
      return data;
    }
  });
}
