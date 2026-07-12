import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors.js";
import { getSupabaseAdminClient, getSupabaseAuthClient } from "../config/supabase.js";
import type { AuthenticatedRequest, Role } from "../types/index.js";

export async function auth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return next(new ApiError(401, "Missing bearer token"));
  }

  const authClient = getSupabaseAuthClient();
  const { data, error } = await authClient.auth.getUser(token);

  if (error || !data.user) {
    return next(new ApiError(401, "Invalid or expired token"));
  }

  const admin = getSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, email, full_name, role, department_id")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    return next(new ApiError(403, "Authenticated user does not have a profile"));
  }

  (req as AuthenticatedRequest).user = {
    id: profile.id,
    email: profile.email ?? data.user.email,
    full_name: profile.full_name,
    role: profile.role as Role,
    department_id: profile.department_id
  };

  return next();
}
