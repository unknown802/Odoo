import { motion } from "framer-motion";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card } from "../ui/Card";
import type { Asset, Department } from "../../types";
import type { DashboardAnalytics } from "../../hooks/useDashboard";

interface AnalyticsSectionProps {
  assets: Asset[];
  departments: Department[];
  analyticsData: DashboardAnalytics;
}

// ── Semantic Color Palette (consistent across all charts) ──────────────────
const PALETTE = {
  brand:   "#2563EB",
  success: "#10B981",
  warning: "#F59E0B",
  danger:  "#EF4444",
  neutral: "#94A3B8",
  violet:  "#8B5CF6",
};

const STATUS_COLORS: Record<string, string> = {
  Available:        PALETTE.success,
  Allocated:        PALETTE.brand,
  "Under Maintenance": PALETTE.warning,
  Lost:             PALETTE.danger,
  Retired:          PALETTE.neutral,
  Disposed:         PALETTE.neutral,
};

// ── Tooltip styles ──────────────────────────────────────────────────────────
const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid var(--color-border)",
  boxShadow: "var(--shadow-md)",
  backgroundColor: "var(--color-surface)",
  color: "var(--color-ink)",
  fontSize: "12px",
  fontWeight: 600,
};

const tooltipLabelStyle = {
  color: "var(--color-muted)",
  fontWeight: 700,
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const axisTickStyle = { fill: "var(--color-muted)", fontSize: 11, fontWeight: 500 };

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

export function AnalyticsSection({ assets, departments, analyticsData }: AnalyticsSectionProps) {
  // ── Status Distribution ──────────────────────────────────────────────────
  const statusCounts = analyticsData.statusCounts;

  const statusData = Object.entries(statusCounts)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
    .sort((a, b) => b.value - a.value);

  // ── Department Allocation ────────────────────────────────────────────────
  const deptCounts = analyticsData.deptCounts;

  const deptData = departments
    .map((dept) => ({ name: dept.name.length > 12 ? dept.name.slice(0, 12) + "…" : dept.name, allocated: deptCounts[dept.id] || 0 }))
    .filter((d) => d.allocated > 0)
    .sort((a, b) => b.allocated - a.allocated)
    .slice(0, 8);

  // ── Utilization snapshot (current-state only, no fabricated history) ─────
  const allocated = statusCounts["Allocated"] || 0;
  const available = statusCounts["Available"] || 0;
  const maintenance = statusCounts["Under_Maintenance"] || 0;

  const snapshotData = [
    { name: "Available", value: available, color: PALETTE.success },
    { name: "Allocated", value: allocated, color: PALETTE.brand },
    { name: "Maintenance", value: maintenance, color: PALETTE.warning },
  ].filter((d) => d.value > 0);

  // ── Donut centre label ───────────────────────────────────────────────────
  const total = assets.length;

  const sectionVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
    >
      {/* Asset Status Snapshot (replaces fake trend area chart) */}
      <motion.div variants={fadeUp} className="lg:col-span-1">
        <Card className="flex h-[360px] flex-col p-6">
          <div className="mb-4">
            <h3 className="text-card-title text-ink">Asset Status</h3>
            <p className="mt-0.5 text-xs text-muted">Current snapshot of all assets</p>
          </div>
          <div className="relative flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
                  </filter>
                </defs>
                <Pie
                  data={statusData}
                  cx="50%" cy="45%"
                  innerRadius={70} outerRadius={105}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={600}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] ?? PALETTE.neutral} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={{ color: "var(--color-ink)", fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Centre label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: "10%" }}>
              <span className="text-3xl font-extrabold tracking-tight text-ink">{total}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Total</span>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {statusData.slice(0, 4).map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] ?? PALETTE.neutral }} />
                <span className="text-[11px] font-medium text-muted truncate" title={s.name}>
                  {s.name} ({s.value})
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Utilisation breakdown area — using real snapshot as stacked bars */}
      <motion.div variants={fadeUp} className="lg:col-span-2">
        <Card className="flex h-[360px] flex-col p-6">
          <div className="mb-4">
            <h3 className="text-card-title text-ink">Asset Utilisation Snapshot</h3>
            <p className="mt-0.5 text-xs text-muted">Distribution by operational state</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snapshotData} margin={{ top: 10, right: 8, left: -24, bottom: 0 }} barSize={40}>
                <defs>
                  {snapshotData.map((d) => (
                    <linearGradient key={d.name} id={`grad-${d.name}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={d.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={d.color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTickStyle} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={axisTickStyle} />
                <Tooltip
                  cursor={{ fill: "var(--color-hover)", radius: 8 }}
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                />
                <Bar dataKey="value" name="Assets" radius={[6, 6, 0, 0]}>
                  {snapshotData.map((d) => (
                    <Cell key={d.name} fill={`url(#grad-${d.name})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Department Allocation */}
      <motion.div variants={fadeUp} className="lg:col-span-3">
        <Card className="flex h-[280px] flex-col p-6">
          <div className="mb-4">
            <h3 className="text-card-title text-ink">Department Allocation</h3>
            <p className="mt-0.5 text-xs text-muted">Assets currently assigned per department</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-dept" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PALETTE.brand} stopOpacity={1} />
                    <stop offset="100%" stopColor={PALETTE.brand} stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTickStyle} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={axisTickStyle} />
                <Tooltip
                  cursor={{ fill: "var(--color-hover)", radius: 8 }}
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                />
                <Bar dataKey="allocated" name="Allocated Assets" fill="url(#grad-dept)" radius={[6, 6, 0, 0]} maxBarSize={52} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
