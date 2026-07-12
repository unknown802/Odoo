import { Router } from "express";
import { hasSupabaseAdminConfig, hasSupabaseConfig } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "assetflow-api",
    supabaseAuthConfigured: hasSupabaseConfig,
    supabaseAdminConfigured: hasSupabaseAdminConfig
  });
});
