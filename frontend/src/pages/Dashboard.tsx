import { motion } from "framer-motion";
import { useDashboard, useDashboardAnalytics } from "../hooks/useDashboard";
import { useAssetFlowStore } from "../store/assetFlowStore";
import { KPICards } from "../components/dashboard/KPICards";
import { AnalyticsSection } from "../components/dashboard/AnalyticsSection";
import { QuickActions } from "../components/dashboard/QuickActions";
import { OverdueReturnsTable } from "../components/dashboard/OverdueReturnsTable";
import {
  OperationalSummaryBar,
  OrganizationHealthWidget,
  PendingApprovalsWidget,
  MaintenanceAlertsWidget,
  RecentNotificationsWidget,
} from "../components/dashboard/NewWidgets";
import { useAllAssets } from "../hooks/useAssets";
import { useNotifications } from "../hooks/useNotifications";
import { useTransfers, useMaintenance, useOrg } from "../hooks/useApi";
import { PageHeader } from "../components/ui/PageHeader";

export function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useDashboard();
  const { data: analytics, isLoading: loadingAnalytics } = useDashboardAnalytics();
  const { data: pagedAssets, isLoading: loadingAssets } = useAllAssets();
  const assets = Array.isArray(pagedAssets) ? pagedAssets : pagedAssets ?? [];
  const { data: transfers = [], isLoading: loadingTransfers } = useTransfers();
  const { data: maintenance = [], isLoading: loadingMaintenance } = useMaintenance();
  const { data: notifications = [], isLoading: loadingNotifications } = useNotifications();
  const { data: orgData, isLoading: loadingOrg } = useOrg();

  const session = useAssetFlowStore((s) => s.session);
  const setActiveView = useAssetFlowStore((state) => state.setActiveView);

  const pending = transfers.filter((t) => t.status === "Requested");
  const maintenanceAlerts = maintenance.filter((m) => m.status === "In_Progress" || m.priority === "High");

  const isLoading =
    loadingSummary ||
    loadingAnalytics ||
    loadingAssets ||
    loadingTransfers ||
    loadingMaintenance ||
    loadingNotifications ||
    loadingOrg;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-brand" />
      </div>
    );
  }

  // Fallback to empty defaults if requests fail (e.g., Supabase not configured)
  const safeSummary = summary ?? {
    assetsAvailable: 0,
    assetsAllocated: 0,
    maintenanceToday: 0,
    activeBookings: 0,
    pendingTransfers: 0,
    upcomingReturns: 0,
    overdueAllocations: []
  };

  const safeAnalytics = analytics ?? {
    statusCounts: {},
    deptCounts: {}
  };

  // Derive user name: prefer session > first admin profile
  const profile = orgData?.profiles?.find(p => p.role === "Admin") ?? orgData?.profiles?.[0];
  const userName = session?.full_name ?? profile?.full_name ?? "User";

  // ── Animation variants ──────────────────────────────────────────────────────
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 26 } },
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -24 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 24 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
  };

  return (
    <motion.div
      className="flex flex-col gap-6 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <PageHeader 
        title={`Welcome back, ${userName.split(" ")[0]}`}
        subtitle="Here is what's happening with your assets today."
      />

      {/* ── ZONE 1: Command Center ─────────────────────────────────────────── */}

      {/* Operational Summary Bar */}
      <motion.div variants={fadeUp}>
        <OperationalSummaryBar
          overdueCount={safeSummary.overdueAllocations.length}
          pendingCount={pending.length}
          maintenanceCount={maintenanceAlerts.length}
          setActiveView={setActiveView}
        />
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fadeUp}>
        <KPICards summary={safeSummary} />
      </motion.div>

      {/* ── ZONE 2: Critical Actions ───────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        {/* Overdue Returns Table — left, larger */}
        <motion.div variants={slideInLeft} className="min-w-0">
          <OverdueReturnsTable
            overdueAllocations={safeSummary.overdueAllocations}
            assets={assets}
            profiles={orgData?.profiles ?? []}
          />
        </motion.div>

        {/* Pending Approvals — right, action inbox */}
        <motion.div variants={slideInRight} className="min-w-0">
          <PendingApprovalsWidget transfers={transfers} assets={assets} profiles={orgData?.profiles ?? []} />
        </motion.div>
      </motion.div>

      {/* ── ZONE 3: Health & Status ────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid gap-6 md:grid-cols-3">
        <OrganizationHealthWidget summary={safeSummary} assets={assets} maintenance={maintenance} />
        <MaintenanceAlertsWidget maintenance={maintenance} />
        <QuickActions setActiveView={setActiveView} />
      </motion.div>

      {/* ── ZONE 4: Analytics ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <AnalyticsSection
          assets={assets}
          departments={orgData?.departments ?? []}
          analyticsData={safeAnalytics}
        />
      </motion.div>

      {/* ── ZONE 5: Activity Log ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <RecentNotificationsWidget notifications={notifications} />
      </motion.div>
    </motion.div>
  );
}
