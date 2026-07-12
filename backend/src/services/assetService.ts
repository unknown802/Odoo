import { ApiError } from "../errors.js";
import { getSupabaseAdminClient } from "../config/supabase.js";
import { getAllocationBlocker } from "./conflictRules.js";
import { notificationService } from "./notificationService.js";
import type { AssetAvailability, UserContext } from "../types/index.js";

export async function createAllocationWithConflictCheck(
  input: {
    asset_id: string;
    allocated_to_id?: string | null;
    allocated_to_department_id?: string | null;
    expected_return_date?: string;
  },
  user: UserContext
) {
  const supabase = getSupabaseAdminClient();
  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select("id, status, current_holder_id, name, asset_tag")
    .eq("id", input.asset_id)
    .single<AssetAvailability>();

  if (assetError || !asset) {
    throw new ApiError(404, "Asset not found");
  }

  const blocker = getAllocationBlocker(asset);

  if (blocker) {
    if (blocker.current_holder_id) {
      const { data: holder } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", blocker.current_holder_id)
        .maybeSingle();

      blocker.message = `${asset.name} (${asset.asset_tag ?? "untagged"}) is currently held by ${
        holder?.full_name ?? "another employee"
      }.`;
    }

    throw new ApiError(blocker.statusCode, blocker.error, blocker);
  }

  const { data, error } = await supabase
    .from("asset_allocations")
    .insert({
      asset_id: input.asset_id,
      allocated_to_id: input.allocated_to_id,
      allocated_to_department_id: input.allocated_to_department_id,
      allocated_by_id: user.id,
      expected_return_date: input.expected_return_date,
      status: "Active"
    })
    .select()
    .single();

  if (error) {
    throw new ApiError(500, error.message);
  }

  if (input.allocated_to_id) {
    await notificationService.create({
      user_id: input.allocated_to_id,
      type: "Asset_Assigned",
      title: "New Asset Assigned",
      message: `You have been assigned ${asset.name} (${asset.asset_tag ?? "untagged"}).`,
      data: { asset_id: asset.id, allocation_id: data.id }
    });
  }

  return data;
}
