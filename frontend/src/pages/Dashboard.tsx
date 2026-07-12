import { motion } from "framer-motion";
import { useDashboard } from "../hooks/useDashboard";
import { useAssetFlowStore } from "../store/assetFlowStore";
import { KPICards } from "../components/dashboard/KPICards";
import { AnalyticsSection } from "../components/dashboard/AnalyticsSection";
import { QuickActions } from "../components/dashboard/QuickActions";
import { OverdueReturnsTable } from "../components/dashboard/OverdueReturnsTable";
import {
  OrganizationHealthWidget,
  PendingApprovalsWidget,
  MaintenanceAlertsWidget,
  RecentNotificationsWidget
} from "../components/dashboard/NewWidgets";

export function Dashboard() {
  const summary = useDashboard();
  const setActiveView = useAssetFlowStore((state) => state.setActiveView);
  const assets = useAssetFlowStore((state) => state.assets);
  const profiles = useAssetFlowStore((state) => state.profiles);
  const departments = useAssetFlowStore((state) => state.departments);
  const transfers = useAssetFlowStore((state) => state.transfers);
  const maintenance = useAssetFlowStore((state) => state.maintenance);
  const notifications = useAssetFlowStore((state) => state.notifications);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const scaleUp = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    show: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { type: "spring" as const, stiffness: 300, damping: 24 } 
    }
  };

  const slideRight = {
    hidden: { opacity: 0, x: -30 },
    show: { 
      opacity: 1, 
      x: 0, 
      transition: { type: "spring" as const, stiffness: 300, damping: 28 } 
    }
  };

  const slideLeft = {
    hidden: { opacity: 0, x: 30 },
    show: { 
      opacity: 1, 
      x: 0, 
      transition: { type: "spring" as const, stiffness: 300, damping: 28 } 
    }
  };

  return (
    <motion.div 
      className="flex flex-col gap-6 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={scaleUp}>
        <KPICards summary={summary} />
      </motion.div>

      <motion.div variants={slideRight} className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
        <OrganizationHealthWidget />
        <PendingApprovalsWidget transfers={transfers} assets={assets} profiles={profiles} />
        <MaintenanceAlertsWidget maintenance={maintenance} assets={assets} />
        <QuickActions setActiveView={setActiveView} />
      </motion.div>

      <motion.div variants={scaleUp}>
        <AnalyticsSection assets={assets} departments={departments} />
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <motion.div variants={slideRight} className="min-w-0">
          <OverdueReturnsTable 
            overdueAllocations={summary.overdueAllocations} 
            assets={assets} 
            profiles={profiles} 
          />
        </motion.div>
        <motion.div variants={slideLeft} className="h-[600px] min-w-0">
          <RecentNotificationsWidget notifications={notifications} />
        </motion.div>
      </div>
    </motion.div>
  );
}
