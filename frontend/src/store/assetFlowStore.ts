import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { ViewKey } from "../types";

interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department_id: string | null;
}

interface AssetFlowState {
  // Navigation
  activeView: ViewKey;
  setActiveView: (view: ViewKey) => void;

  // Auth / Session
  session: SessionUser | null;
  isAuthLoading: boolean;
  authError: string | null;

  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrapSession: () => Promise<void>;
}

export const useAssetFlowStore = create<AssetFlowState>((set, get) => ({
  // ── Navigation ────────────────────────────────────────────────────────────
  activeView: "dashboard",
  setActiveView: (activeView) => set({ activeView }),

  // ── Auth ──────────────────────────────────────────────────────────────────
  session: null,
  isAuthLoading: true,
  authError: null,

  login: async (email, password) => {
    set({ isAuthLoading: true, authError: null });

    if (!isSupabaseConfigured || !supabase) {
      // Demo mode: bypass auth
      set({
        session: { id: "demo", email, full_name: "Demo User", role: "Admin", department_id: null },
        isAuthLoading: false,
        activeView: "dashboard",
      });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      set({ authError: error?.message ?? "Login failed.", isAuthLoading: false });
      return;
    }

    await get().bootstrapSession();
    set({ activeView: "dashboard" });
  },

  signUp: async (email, password, fullName) => {
    set({ isAuthLoading: true, authError: null });

    if (!isSupabaseConfigured || !supabase) {
      set({ authError: "Supabase not configured — cannot create account.", isAuthLoading: false });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      set({ authError: error.message, isAuthLoading: false });
      return;
    }

    set({ isAuthLoading: false, authError: null });
    // User needs to confirm email - keep them on login with a notice
  },

  logout: async () => {
    if (supabase) await supabase.auth.signOut();
    set({ session: null, activeView: "auth" });
  },

  bootstrapSession: async () => {
    set({ isAuthLoading: true });

    if (!isSupabaseConfigured || !supabase) {
      // Demo mode: allow access without real auth
      set({ isAuthLoading: false, session: null });
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      set({ isAuthLoading: false, session: null });
      return;
    }

    try {
      const res = await fetch("/api/org/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Profile fetch failed");

      const profile: SessionUser = await res.json();
      set({ session: profile, isAuthLoading: false });
    } catch {
      set({ session: null, isAuthLoading: false });
    }
  },
}));
