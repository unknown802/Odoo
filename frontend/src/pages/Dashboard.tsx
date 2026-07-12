import { CalendarClock, PackagePlus, Repeat2, Wrench } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useDashboard } from "../hooks/useDashboard";
import { daysOverdue, formatDate, statusTone } from "../lib/utils";
import { useAssetFlowStore } from "../store/assetFlowStore";

export function Dashboard() {
  const summary = useDashboard();
  const setActiveView = useAssetFlowStore((state) => state.setActiveView);
  const assets = useAssetFlowStore((state) => state.assets);
  const profiles = useAssetFlowStore((state) => state.profiles);

  const kpis = [
    ["Assets Available", summary.assetsAvailable],
    ["Assets Allocated", summary.assetsAllocated],
    ["Maintenance Today", summary.maintenanceToday],
    ["Active Bookings", summary.activeBookings],
    ["Pending Transfers", summary.pendingTransfers],
    ["Upcoming Returns", summary.upcomingReturns]
  ] as const;

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map(([label, value]) => (
          <Card key={label} className="min-h-28">
            <div className="text-sm font-semibold text-muted">{label}</div>
            <div className="mt-3 text-3xl font-bold">{value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-md border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-bold">Overdue Returns</h2>
            <Badge tone={summary.overdueAllocations.length ? "danger" : "success"}>{summary.overdueAllocations.length} open</Badge>
          </div>
          <div className="table-shell rounded-none border-0">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Holder</th>
                  <th>Due</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {summary.overdueAllocations.map((allocation) => {
                  const asset = assets.find((candidate) => candidate.id === allocation.asset_id);
                  const holder = profiles.find((candidate) => candidate.id === allocation.allocated_to_id);
                  return (
                    <tr key={allocation.id}>
                      <td>
                        <div className="font-semibold">{asset?.name}</div>
                        <div className="text-xs text-muted">{asset?.asset_tag}</div>
                      </td>
                      <td>{holder?.full_name}</td>
                      <td>{formatDate(allocation.expected_return_date)}</td>
                      <td>
                        <Badge tone="danger">{daysOverdue(allocation.expected_return_date)} days</Badge>
                      </td>
                    </tr>
                  );
                })}
                {summary.overdueAllocations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-muted">
                      No overdue returns.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-md border border-border bg-white p-4">
          <h2 className="font-bold">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            <Button onClick={() => setActiveView("assets")} title="Register Asset">
              <PackagePlus className="h-4 w-4" /> Register Asset
            </Button>
            <Button variant="secondary" onClick={() => setActiveView("bookings")} title="Book Resource">
              <CalendarClock className="h-4 w-4" /> Book Resource
            </Button>
            <Button variant="secondary" onClick={() => setActiveView("maintenance")} title="Raise Maintenance">
              <Wrench className="h-4 w-4" /> Raise Maintenance
            </Button>
            <Button variant="ghost" onClick={() => setActiveView("allocation")} title="Review Transfers">
              <Repeat2 className="h-4 w-4" /> Review Transfers
            </Button>
          </div>
        </section>
      </div>

      <section className="rounded-md border border-border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Asset Status Pulse</h2>
          <Badge tone="info">Realtime-ready</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {assets.map((asset) => (
            <div key={asset.id} className="rounded-md border border-border p-3">
              <div className="text-sm font-semibold">{asset.asset_tag}</div>
              <div className="mt-1 truncate text-sm text-muted">{asset.name}</div>
              <Badge className="mt-3" tone={statusTone(asset.status)}>
                {asset.status.replace("_", " ")}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
