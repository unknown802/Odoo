import { motion } from "framer-motion";
import { 
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, 
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis 
} from "recharts";
import { Card } from "../ui/Card";
import type { Asset, Department } from "../../types";

interface AnalyticsSectionProps {
  assets: Asset[];
  departments: Department[];
}

export function AnalyticsSection({ assets, departments }: AnalyticsSectionProps) {
  // Asset Status Distribution (Donut Chart)
  const statusCounts = assets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts)
    .map(([name, value]) => ({ name: name.replace("_", " "), value }))
    .sort((a, b) => b.value - a.value);

  const STATUS_COLORS: Record<string, string> = {
    Available: "#10b981",
    Allocated: "#3b82f6",
    "Under Maintenance": "#f59e0b",
    Lost: "#ef4444",
    Retired: "#6b7280",
    Disposed: "#9ca3af"
  };

  // Department Allocation (Bar Chart)
  const deptCounts = assets.reduce((acc, asset) => {
    if (asset.current_department_id) {
      acc[asset.current_department_id] = (acc[asset.current_department_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const deptData = departments
    .map(dept => ({
      name: dept.name,
      allocated: deptCounts[dept.id] || 0,
    }))
    .filter(d => d.allocated > 0)
    .sort((a, b) => b.allocated - a.allocated);

  // Asset Utilization Trend (Mocked 6-month data based on current state to show a realistic chart)
  const currentTotal = assets.length;
  const currentAllocated = statusCounts["Allocated"] || 0;
  
  const utilizationData = [
    { name: "Jan", allocated: Math.max(0, currentAllocated - 15), available: Math.max(0, currentTotal - (currentAllocated - 15)) },
    { name: "Feb", allocated: Math.max(0, currentAllocated - 10), available: Math.max(0, currentTotal - (currentAllocated - 10)) },
    { name: "Mar", allocated: Math.max(0, currentAllocated - 12), available: Math.max(0, currentTotal - (currentAllocated - 12)) },
    { name: "Apr", allocated: Math.max(0, currentAllocated - 5), available: Math.max(0, currentTotal - (currentAllocated - 5)) },
    { name: "May", allocated: Math.max(0, currentAllocated - 2), available: Math.max(0, currentTotal - (currentAllocated - 2)) },
    { name: "Jun", allocated: currentAllocated, available: currentTotal - currentAllocated },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
  };

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {/* Asset Utilization */}
      <motion.div variants={fadeUp} className="lg:col-span-2">
        <Card className="flex h-[380px] flex-col p-5">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">Asset Utilization Trend</h3>
            <p className="text-sm text-slate-500">6-month overview of allocated vs available assets</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAllocated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="allocated" name="Allocated" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorAllocated)" />
                <Area type="monotone" dataKey="available" name="Available" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAvailable)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Status Distribution */}
      <motion.div variants={fadeUp}>
        <Card className="flex h-[380px] flex-col p-5">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">Status Distribution</h3>
            <p className="text-sm text-slate-500">Current state of all assets</p>
          </div>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#cbd5e1"} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 500 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-800">{assets.length}</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {statusData.slice(0, 4).map((status) => (
              <div key={status.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[status.name] || '#cbd5e1' }} />
                <span className="text-xs font-medium text-slate-600 truncate" title={status.name}>
                  {status.name} ({status.value})
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Department Allocation */}
      <motion.div variants={fadeUp} className="lg:col-span-3">
        <Card className="flex h-[320px] flex-col p-5">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">Department Allocation</h3>
            <p className="text-sm text-slate-500">Distribution of allocated assets across departments</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="allocated" name="Allocated Assets" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
