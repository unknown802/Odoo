import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173")
});

export const env = envSchema.parse(process.env);

export const hasSupabaseConfig = Boolean(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY);
export const hasSupabaseAdminConfig = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
