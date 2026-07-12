import Papa from "papaparse";
import { BarChart, Bar, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { exportCsv } from "../lib/utils";
import { useAssetFlowStore } from "../store/assetFlowStore";

export function Reports() {
  const assets = useAssetFlowStore((state) => state.assets);
  const categories = useAssetFlowStore((state) => state.categories);
  const maintenance = useAssetFlowStore((state) => state.maintenance);
  const allocations = useAssetFlowStore((state) => state.allocations);

  const utilization = categories.map((category) => {
    const scoped = assets.filter((asset) => asset.category_id === category.id);
    return {
      name: category.name,
      Allocated: scoped.filter((asset) => asset.status === "Allocated").length,
      Available: scoped.filter((asset) => asset.status === "Available").length
    };
  });

  const departmentAllocation = [
    { name: "Engineering", value: assets.filter((asset) => asset.current_department_id === "dept-eng").length, color: "#0f9f8f" },
    { name: "Operations", value: assets.filter((asset) => asset.current_department_id === "dept-ops").length, color: "#f59e0b" },
    { name: "Finance", value: assets.filter((asset) => asset.current_department_id === "dept-fin").length, color: "#2563eb" }
  ];

  const maintenanceTrend = [
    { date: "Jul 8", requests: 1 },
    { date: "Jul 9", requests: 0 },
    { date: "Jul 10", requests: 1 },
    { date: "Jul 11", requests: 0 },
    { date: "Jul 12", requests: maintenance.length }
  ];

  const overdueRows = allocations.filter((allocation) => allocation.status === "Active" && allocation.expected_return_date && allocation.expected_return_date < "2026-07-12");

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="h-80">
          <h2 className="font-bold">Asset Utilization</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={utilization}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="Allocated" fill="#0f9f8f" />
              <Bar dataKey="Available" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="h-80">
          <h2 className="font-bold">Department Allocation</h2>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={departmentAllocation} dataKey="value" nameKey="name" outerRadius={90} label>
                {departmentAllocation.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="h-80">
          <h2 className="font-bold">Maintenance Frequency</h2>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={maintenanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="requests" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <section className="table-shell">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-bold">Overdue Returns</h2>
          <Button
            variant="secondary"
            title="Export CSV"
            onClick={() => exportCsv("overdue-returns.csv", Papa.unparse(overdueRows))}
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Expected Return</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {overdueRows.map((allocation) => {
              const asset = assets.find((candidate) => candidate.id === allocation.asset_id);
              return (
                <tr key={allocation.id}>
                  <td>{asset?.asset_tag} - {asset?.name}</td>
                  <td>{allocation.expected_return_date}</td>
                  <td>{allocation.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
