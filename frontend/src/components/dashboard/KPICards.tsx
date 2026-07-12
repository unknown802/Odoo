import { motion } from "framer-motion";
import { Package, CheckCircle2, AlertTriangle, CalendarClock, ArrowRightLeft, Clock } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { Card } from "../ui/Card";

interface KPICardsProps {
  summary: {
    assetsAvailable: number;
    assetsAllocated: number;
    maintenanceToday: number;
    activeBookings: number;
    pendingTransfers: number;
    upcomingReturns: number;
  };
}

const generateSparkline = (base: number, variance: number = 4) => {
  const pattern = [-2, -1, 1, 0, 2, 1, 3];
  return pattern.map((step, index) => ({
    value: Math.max(0, base + step * Math.max(1, variance / 3) + index * 0.15)
  }));
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export function KPICards({ summary }: KPICardsProps) {
  const kpis = [
    {
      label: "Assets Available",
      value: summary.assetsAvailable,
      trend: "+4.2%",
      trendUp: true,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-50",
      data: generateSparkline(summary.assetsAvailable, 5)
    },
    {
      label: "Assets Allocated",
      value: summary.assetsAllocated,
      trend: "+12.5%",
      trendUp: true,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      data: generateSparkline(summary.assetsAllocated, 10)
    },
    {
      label: "Maintenance Today",
      value: summary.maintenanceToday,
      trend: summary.maintenanceToday > 5 ? "+2.1%" : "-5.4%",
      trendUp: summary.maintenanceToday <= 5,
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-50",
      data: generateSparkline(summary.maintenanceToday, 2)
    },
    {
      label: "Active Bookings",
      value: summary.activeBookings,
      trend: "+18.2%",
      trendUp: true,
      icon: CalendarClock,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      data: generateSparkline(summary.activeBookings, 8)
    },
    {
      label: "Pending Transfers",
      value: summary.pendingTransfers,
      trend: "-2.4%",
      trendUp: false,
      icon: ArrowRightLeft,
      color: "text-violet-500",
      bg: "bg-violet-50",
      data: generateSparkline(summary.pendingTransfers, 3)
    },
    {
      label: "Upcoming Returns",
      value: summary.upcomingReturns,
      trend: "+8.1%",
      trendUp: true,
      icon: Clock,
      color: "text-cyan-500",
      bg: "bg-cyan-50",
      data: generateSparkline(summary.upcomingReturns, 4)
    }
  ];

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    >
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <motion.div key={kpi.label} variants={item}>
              <Card className="group relative flex min-h-[140px] cursor-default flex-col justify-between overflow-hidden p-5 transition-all hover:border-slate-300 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className={`rounded-md p-2 ${kpi.bg}`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div className="h-8 w-16 opacity-60 transition-opacity group-hover:opacity-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpi.data}>
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={kpi.trendUp ? "#10b981" : "#f43f5e"} 
                        strokeWidth={2} 
                        dot={false} 
                        isAnimationActive={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-800">
                    {kpi.value}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">{kpi.label}</span>
                  <span className={`text-xs font-semibold ${kpi.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kpi.trend}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
