import { useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { ActivityLogs } from "./pages/ActivityLogs";
import { AssetAllocation } from "./pages/AssetAllocation";
import { AssetDirectory } from "./pages/AssetDirectory";
import { AuditCycles } from "./pages/AuditCycles";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Maintenance } from "./pages/Maintenance";
import { OrganizationSetup } from "./pages/OrganizationSetup";
import { Reports } from "./pages/Reports";
import { ResourceBooking } from "./pages/ResourceBooking";
import { useAssetFlowStore } from "./store/assetFlowStore";
import { isSupabaseConfigured } from "./lib/supabase";

const views = {
  dashboard: Dashboard,
  auth: Login,
  organization: OrganizationSetup,
  assets: AssetDirectory,
  allocation: AssetAllocation,
  bookings: ResourceBooking,
  maintenance: Maintenance,
  audits: AuditCycles,
  reports: Reports,
  activity: ActivityLogs
};

export default function App() {
  const { activeView, isAuthLoading, session, bootstrapSession, setActiveView } = useAssetFlowStore();

  // Bootstrap session once on mount
  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  // Redirect to auth if Supabase is configured AND no session and not already on auth page
  useEffect(() => {
    if (!isAuthLoading && isSupabaseConfigured && !session && activeView !== "auth") {
      setActiveView("auth");
    }
  }, [isAuthLoading, session, activeView, setActiveView]);

  // Show a centered spinner while checking session
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-brand" />
          <p className="text-sm text-muted font-medium">Loading AssetFlow...</p>
        </div>
      </div>
    );
  }

  const CurrentView = views[activeView] ?? Dashboard;

  return (
    <AppShell>
      <CurrentView />
    </AppShell>
  );
}
