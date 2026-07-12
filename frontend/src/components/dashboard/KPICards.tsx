import { motion } from "framer-motion";
import {
  Package, CheckCircle2, AlertTriangle, CalendarClock,
  ArrowRightLeft, Clock, TrendingUp, TrendingDown
} from "lucide-react";

interface KPISummary {
  assetsAvailable: number;
  assetsAllocated: number;
  maintenanceToday: number;
  activeBookings: number;
  pendingTransfers: number;
  upcomingReturns: number;
  overdueAllocations: { id: string }[];
}

interface KPICardsProps {
  summary: KPISummary;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 340, damping: 26 },
  },
};

interface KPIConfig {
  label: string;
  value: number;
  icon: typeof Package;
  iconColor: string;
  iconBg: string;
  accentBorder: string;
  tone: "info" | "success" | "warning" | "danger" | "neutral";
  /** When true value = bad news (e.g. maintenance/overdue) */
  invertSemantic?: boolean;
  /** If provided, shows a comparison sub-label */
  sublabel?: string;
}

function KPICard({ config, index }: { config: KPIConfig; index: number }) {
  const Icon = config.icon;

  // Only show the trend arrow when value > 0 and semantic is clear
  const showTrend = config.value > 0;
  const isBad = config.invertSemantic ? config.value > 0 : false;

  return (
    <motion.div variants={item}>
      <div
        className={`card-enterprise group relative flex flex-col gap-4 p-5 cursor-default transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg border-t-2 ${config.accentBorder}`}
        role="region"
        aria-label={config.label}
      >
        {/* Top row: icon + trend indicator */}
        <div className="flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.iconBg}`}>
            <Icon className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
          </div>

          {showTrend && (
            <span
              className={`flex items-center gap-0.5 text-xs font-semibold ${isBad ? "text-danger" : "text-success"}`}
              aria-label={isBad ? "needs attention" : "healthy"}
            >
              {isBad
                ? <TrendingUp className="h-3.5 w-3.5" />
                : <TrendingDown className="h-3.5 w-3.5 opacity-0" />
              }
            </span>
          )}
        </div>

        {/* Value */}
        <div>
          <div
            className="text-3xl font-extrabold tracking-tight text-ink count-animate"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {config.value}
          </div>
          <div className="mt-1.5 text-xs font-semibold text-muted uppercase tracking-wider leading-tight">
            {config.label}
          </div>
          {config.sublabel && (
            <div className={`mt-1 text-xs font-medium ${isBad ? "text-danger" : "text-muted"}`}>
              {config.sublabel}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function KPICards({ summary }: KPICardsProps) {
  const overdue = summary.overdueAllocations.length;

  const kpis: KPIConfig[] = [
    {
      label: "Available",
      value: summary.assetsAvailable,
      icon: Package,
      iconColor: "text-brand",
      iconBg: "bg-brand-muted",
      accentBorder: "border-t-brand",
      tone: "info",
    },
    {
      label: "Allocated",
      value: summary.assetsAllocated,
      icon: CheckCircle2,
      iconColor: "text-success",
      iconBg: "bg-success-muted",
      accentBorder: "border-t-success",
      tone: "success",
    },
    {
      label: "In Maintenance",
      value: summary.maintenanceToday,
      icon: AlertTriangle,
      iconColor: "text-warning",
      iconBg: "bg-warning-muted",
      accentBorder: "border-t-warning",
      tone: "warning",
      invertSemantic: true,
      sublabel: summary.maintenanceToday > 0 ? "action may be required" : undefined,
    },
    {
      label: "Active Bookings",
      value: summary.activeBookings,
      icon: CalendarClock,
      iconColor: "text-brand",
      iconBg: "bg-brand-muted",
      accentBorder: "border-t-brand",
      tone: "info",
    },
    {
      label: "Pending Transfers",
      value: summary.pendingTransfers,
      icon: ArrowRightLeft,
      iconColor: "text-warning",
      iconBg: "bg-warning-muted",
      accentBorder: "border-t-warning",
      tone: "warning",
      invertSemantic: true,
      sublabel: summary.pendingTransfers > 0 ? "awaiting approval" : undefined,
    },
    {
      label: "Overdue Returns",
      value: overdue,
      icon: Clock,
      iconColor: overdue > 0 ? "text-danger" : "text-success",
      iconBg: overdue > 0 ? "bg-danger-muted" : "bg-success-muted",
      accentBorder: overdue > 0 ? "border-t-danger" : "border-t-success",
      tone: overdue > 0 ? "danger" : "success",
      invertSemantic: true,
      sublabel: overdue > 0 ? `${overdue} asset${overdue > 1 ? "s" : ""} past due date` : "All returns on time",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6"
      role="list"
      aria-label="Key performance indicators"
    >
      {kpis.map((kpi, index) => (
        <KPICard key={kpi.label} config={kpi} index={index} />
      ))}
    </motion.div>
  );
}
