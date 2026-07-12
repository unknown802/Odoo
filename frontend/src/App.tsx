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
  const activeView = useAssetFlowStore((state) => state.activeView);
  const CurrentView = views[activeView] ?? Dashboard;

  return (
    <AppShell>
      <CurrentView />
    </AppShell>
  );
}
