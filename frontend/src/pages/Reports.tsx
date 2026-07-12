import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Download, BarChart3, PieChart as PieChartIcon, Activity, AlertTriangle, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonCard, SkeletonTable } from "../components/ui/Skeleton";
import { StatusPill } from "../components/ui/StatusPill";
import { Badge } from "../components/ui/Badge";
import { exportCsv, formatDate } from "../lib/utils";
import { useAllAssets } from "../hooks/useAssets";
import { useAllocations, useOrg } from "../hooks/useApi";
import { useDashboardAnalytics } from "../hooks/useDashboard";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
};

export function Reports() {
  const { data: assets = [], isLoading: loadingAssets } = useAllAssets();
  const { data: allocations = [], isLoading: loadingAllocations } = useAllocations();
  const { data: orgData, isLoading: loadingOrg } = useOrg();
  const { data: analytics, isLoading: loadingAnalytics } = useDashboardAnalytics();

  const categories = orgData?.categories ?? [];
  const departments = orgData?.departments ?? [];

  // Asset utilization by category (real data)
  const utilization = categories.map((category) => {
    const scoped = assets.filter((a) => a.category_id === category.id);
    return {
      name: category.name,
      Allocated: scoped.filter((a) => a.status === "Allocated").length,
      Available: scoped.filter((a) => a.status === "Available").length
    };
  });

  // Department allocation from analytics API
  const DEPT_COLORS = ["#0f9f8f", "#f59e0b", "#2563eb", "#8B5CF6", "#EF4444", "#10B981"];
  const deptCounts = analytics?.deptCounts ?? {};
  const departmentAllocation = Object.entries(deptCounts)
    .map(([deptId, value], i) => ({
      name: departments.find((d) => d.id === deptId)?.name ?? deptId,
      value,
      color: DEPT_COLORS[i % DEPT_COLORS.length]
    }))
    .filter((d) => d.value > 0);
    
  const statusBreakdown = analytics 
    ? Object.entries(analytics.statusCounts).map(([name, value], i) => ({ 
        name: name.replace("_", " "), 
        value,
        color: ["#0f9f8f", "#2563eb", "#f59e0b", "#EF4444", "#8B5CF6"][i % 5]
      }))
    : [];

  const overdueRows = allocations.filter(
    (a) => a.status === "Active" && a.expected_return_date && new Date(a.expected_return_date) < new Date()
  );

  const handleExport = () => {
    const dataToExport = overdueRows.map(a => {
      const asset = assets.find(as => as.id === a.asset_id);
      return {
        "Asset Tag": asset?.asset_tag,
        "Asset Name": asset?.name,
        "Expected Return": a.expected_return_date,
        "Status": a.status
      };
    });
    exportCsv("overdue-returns.csv", Papa.unparse(dataToExport));
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.text("Overdue Returns Report", 14, 15);
    
    const tableData = overdueRows.map(a => {
      const asset = assets.find(as => as.id === a.asset_id);
      const expectedDate = new Date(a.expected_return_date!);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - expectedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return [
        asset?.name || "Unknown Asset",
        asset?.asset_tag || "N/A",
        formatDate(a.expected_return_date!),
        `${diffDays} days`,
        a.status
      ];
    });

    autoTable(doc, {
      head: [["Asset Name", "Asset Tag", "Expected Return", "Days Overdue", "Status"]],
      body: tableData,
      startY: 20,
    });

    doc.save("overdue-returns.pdf");
  };

  if (loadingAssets || loadingAllocations || loadingOrg || loadingAnalytics) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports & Analytics" subtitle="Data insights and exports." />
        <div className="grid gap-5 xl:grid-cols-3 mb-6">
          <SkeletonCard className="h-80" />
          <SkeletonCard className="h-80" />
          <SkeletonCard className="h-80" />
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports & Analytics" 
        subtitle="Visualize asset utilization, department distribution, and overdue returns."
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 xl:grid-cols-3"
      >
        <motion.div variants={fadeUp}>
          <Card className="h-96 flex flex-col p-5">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-brand" />
              <h2 className="font-bold text-ink">Asset Utilization</h2>
            </div>
            
            {utilization.length === 0 ? (
              <EmptyState icon={BarChart3} title="No Data" description="No category utilization data available." className="flex-1" />
            ) : (
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <Tooltip 
                      cursor={{ fill: '#F1F5F9' }} 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Allocated" fill="#0f9f8f" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Available" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-96 flex flex-col p-5">
            <div className="flex items-center gap-2 mb-2">
              <PieChartIcon className="h-5 w-5 text-info" />
              <h2 className="font-bold text-ink">Department Allocation</h2>
            </div>
            
            {departmentAllocation.length === 0 ? (
              <EmptyState icon={PieChartIcon} title="No Data" description="No department allocation data available." className="flex-1" />
            ) : (
              <div className="flex-1 w-full min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={departmentAllocation} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60}
                      outerRadius={90} 
                      paddingAngle={2}
                    >
                      {departmentAllocation.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#0F172A', fontWeight: 500 }}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-12">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-ink">{departmentAllocation.reduce((acc, curr) => acc + curr.value, 0)}</div>
                    <div className="text-xs text-muted font-medium">Assets</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-96 flex flex-col p-5">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-ink">Global Status Breakdown</h2>
            </div>
            
            {statusBreakdown.length === 0 ? (
              <EmptyState icon={Activity} title="No Data" description="No status data available." className="flex-1" />
            ) : (
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusBreakdown} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} width={80} />
                    <Tooltip 
                      cursor={{ fill: '#F1F5F9' }} 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={30}>
                      {statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Card className="flex flex-col p-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-white px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-danger" />
              <h2 className="text-base font-bold text-ink">Overdue Returns</h2>
              <Badge tone="danger" className="ml-2">{overdueRows.length}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" title="Export CSV" onClick={handleExport} disabled={overdueRows.length === 0}>
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button variant="secondary" title="Export PDF" onClick={handleExportPdf} disabled={overdueRows.length === 0}>
                <FileText className="h-4 w-4" /> PDF
              </Button>
            </div>
          </div>
          
          <DataTable
            className="border-0 rounded-none shadow-none"
            isEmpty={overdueRows.length === 0}
            emptyState={
              <EmptyState 
                icon={FileText} 
                title="No overdue returns" 
                description="All allocated assets are within their expected return dates." 
              />
            }
          >
            <thead>
              <tr>
                <th>Asset Details</th>
                <th>Expected Return Date</th>
                <th>Days Overdue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {overdueRows.map((allocation) => {
                const asset = assets.find((a) => a.id === allocation.asset_id);
                const expectedDate = new Date(allocation.expected_return_date!);
                const today = new Date();
                const diffTime = Math.abs(today.getTime() - expectedDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                return (
                  <tr key={allocation.id} className="hover:bg-hover transition-colors">
                    <td>
                      <div className="font-semibold text-ink">{asset?.name}</div>
                      <div className="text-xs font-mono text-muted">{asset?.asset_tag}</div>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-danger">{formatDate(allocation.expected_return_date!)}</div>
                    </td>
                    <td>
                      <Badge tone="danger">{diffDays} days</Badge>
                    </td>
                    <td>
                      <StatusPill status={allocation.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </Card>
      </motion.div>
    </div>
  );
}
