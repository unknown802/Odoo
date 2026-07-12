import { CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight, ShieldAlert, FileText, BellRing, AlertCircle, TrendingUp, Check, X } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import type { MaintenanceRequest, TransferRequest, NotificationItem, ViewKey, Asset, Profile } from "../../types";
import { formatDate } from "../../lib/utils";
import { useAssetFlowStore } from "../../store/assetFlowStore";
import { type DashboardSummary } from "../../hooks/useDashboard";
import { useApproveTransfer } from "../../hooks/useApi";
import { useMarkAllNotificationsRead } from "../../hooks/useNotifications";

// ─── Relative Timestamp ──────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "yesterday";
  return formatDate(dateStr);
}

// ─── Operational Summary Bar ──────────────────────────────────────────────────
export function OperationalSummaryBar({
  overdueCount,
  pendingCount,
  maintenanceCount,
  setActiveView,
}: {
  overdueCount: number;
  pendingCount: number;
  maintenanceCount: number;
  setActiveView: (v: ViewKey) => void;
}) {
  const hasAlerts = overdueCount > 0 || pendingCount > 0 || maintenanceCount > 0;

  if (!hasAlerts) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success-soft/50 px-5 py-3.5">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
        <span className="text-sm font-semibold text-success">All systems operational — no items require attention.</span>
      </div>
    );
  }

  const parts: string[] = [];
  if (overdueCount > 0) parts.push(`${overdueCount} overdue return${overdueCount > 1 ? "s" : ""}`);
  if (pendingCount > 0) parts.push(`${pendingCount} pending approval${pendingCount > 1 ? "s" : ""}`);
  if (maintenanceCount > 0) parts.push(`${maintenanceCount} maintenance alert${maintenanceCount > 1 ? "s" : ""}`);

  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-warning/30 bg-warning-soft/60 px-5 py-3.5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
        <span className="text-sm font-semibold text-warning">
          Action required &mdash;&nbsp;
          <span className="text-ink">{parts.join(" · ")}</span>
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {overdueCount > 0 && (
          <button
            onClick={() => setActiveView("allocation")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warning/30 bg-surface px-3 py-1.5 text-xs font-bold text-warning shadow-sm transition-all hover:bg-warning hover:text-white active:scale-95"
          >
            View Overdue <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
        {pendingCount > 0 && (
          <button
            onClick={() => setActiveView("allocation")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand/20 bg-surface px-3 py-1.5 text-xs font-bold text-brand shadow-sm transition-all hover:bg-brand hover:text-white active:scale-95"
          >
            Review Approvals <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Organization Health ──────────────────────────────────────────────────────
export function OrganizationHealthWidget({ summary, assets, maintenance }: { summary: DashboardSummary, assets: Asset[], maintenance: MaintenanceRequest[] }) {
  const total = assets.length || 1;
  const available = summary.assetsAvailable;
  const underMaintenance = summary.maintenanceToday;
  const pendingTransfers = summary.pendingTransfers;
  const overdue = summary.overdueAllocations.length;
  const highMaintenance = maintenance.filter((m) => m.priority === "High" && m.status !== "Resolved").length;

  // Weighted health score
  const availabilityScore = (available / total) * 40;
  const maintenanceScore = Math.max(0, 30 - underMaintenance * 3);
  const pendingScore = Math.max(0, 15 - pendingTransfers * 3);
  const overdueScore = Math.max(0, 15 - overdue * 5);
  const score = Math.round(availabilityScore + maintenanceScore + pendingScore + overdueScore);

  const scoreColor = score >= 85 ? "from-emerald-300 to-emerald-500" : score >= 65 ? "from-amber-300 to-amber-500" : "from-rose-300 to-rose-500";
  const statusText = score >= 85 ? "System operating optimally" : score >= 65 ? "Minor issues detected" : "Attention required";

  return (
    <Card className="flex flex-col p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-lg relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-32 w-32 rounded-full bg-brand/20 blur-2xl" />

      <div className="relative z-10 flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
        </div>
        <h3 className="text-base font-bold">Organization Health</h3>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center items-center">
        <div className={`text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${scoreColor}`}>
          {score}<span className="text-2xl">%</span>
        </div>
        <p className="text-slate-400 text-sm mt-2 font-medium">{statusText}</p>

        {/* Progress bar */}
        <div className="mt-4 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full bg-gradient-to-r ${scoreColor} transition-all duration-700`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="relative z-10 mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Available</div>
          <div className="text-sm font-bold mt-1 text-slate-200">{available}/{total}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Alerts</div>
          <div className={`text-sm font-bold mt-1 ${highMaintenance > 0 ? "text-rose-300" : "text-emerald-300"}`}>
            {highMaintenance > 0 ? `${highMaintenance} High` : "Passing"}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Pending Approvals (with inline approve) ──────────────────────────────────
export function PendingApprovalsWidget({ transfers, profiles, assets }: { transfers: TransferRequest[], profiles: Profile[], assets: Asset[] }) {
  const approveTransferMutation = useApproveTransfer();
  const setActiveView = useAssetFlowStore((s) => s.setActiveView);

  const pending = transfers.filter((t) => t.status === "Requested");

  const resolveName = (id: string | null | undefined) =>
    profiles.find((p) => p.id === id)?.full_name ?? id ?? "Unassigned";
  const resolveAsset = (id: string) =>
    assets.find((a) => a.id === id)?.name ?? "Asset";

  return (
    <Card className="flex flex-col p-0 overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface">
        <div className="flex items-center gap-2.5">
          <FileText className="h-4 w-4 text-muted" />
          <h3 className="text-sm font-bold text-ink">Pending Approvals</h3>
        </div>
        <Badge tone={pending.length > 0 ? "warning" : "neutral"}>{pending.length}</Badge>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pending.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-success/50" />
            <p className="text-sm font-medium text-muted">No pending approvals</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pending.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-start gap-3 px-4 py-3 hover:bg-hover transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">{resolveAsset(t.asset_id)}</p>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {resolveName(t.from_holder_id)} → {resolveName(t.to_holder_id)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    title="Approve"
                    onClick={() => approveTransferMutation.mutate(t.id)}
                    disabled={approveTransferMutation.isPending}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-soft text-success transition-all hover:bg-success hover:text-white active:scale-90 disabled:opacity-50"
                  >
                    {approveTransferMutation.isPending && approveTransferMutation.variables === t.id ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    title="Reject"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-soft text-danger transition-all hover:bg-danger hover:text-white active:scale-90"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <button
            onClick={() => setActiveView("allocation")}
            className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
          >
            View all transfers <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </Card>
  );
}

// ─── Maintenance Alerts ───────────────────────────────────────────────────────
export function MaintenanceAlertsWidget({ maintenance }: { maintenance: MaintenanceRequest[] }) {
  const activeAlerts = maintenance.filter((m) => m.status === "In_Progress" || m.priority === "High");

  return (
    <Card className="flex flex-col p-0 overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-4 w-4 text-danger/70" />
          <h3 className="text-sm font-bold text-ink">Maintenance Alerts</h3>
        </div>
        {activeAlerts.length > 0 && (
          <Badge tone="danger">{activeAlerts.length}</Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeAlerts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-success/50" />
            <p className="text-sm font-medium text-muted">System running smoothly</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activeAlerts.slice(0, 4).map((m) => (
              <div key={m.id} className="flex gap-3 px-4 py-3 hover:bg-hover transition-colors cursor-pointer">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${m.priority === "High" ? "text-danger" : "text-warning"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">{m.title}</p>
                  <p className="text-xs text-muted line-clamp-1 mt-0.5">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Recent Notifications Timeline ───────────────────────────────────────────
export function RecentNotificationsWidget({ notifications }: { notifications: NotificationItem[] }) {
  const markAllReadMutation = useMarkAllNotificationsRead();
  const setActiveView = useAssetFlowStore((s) => s.setActiveView);
  const unread = notifications.filter((n) => !n.is_read).length;

  const typeIcon = (type: string) => {
    if (type.includes("Maintenance")) return <AlertTriangle className="h-3.5 w-3.5 text-warning" />;
    if (type.includes("Transfer")) return <TrendingUp className="h-3.5 w-3.5 text-brand" />;
    return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  };

  return (
    <Card className="flex flex-col p-0 overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface">
        <div className="flex items-center gap-2.5">
          <BellRing className="h-4 w-4 text-muted" />
          <h3 className="text-sm font-bold text-ink">Recent Activity</h3>
          {unread > 0 && <Badge tone="info">{unread}</Badge>}
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <BellRing className="h-8 w-8 text-muted/30" />
            <p className="text-sm font-medium text-muted">No recent notifications</p>
          </div>
        ) : (
          <div className="relative flex flex-col divide-y divide-border/60">
            {notifications.slice(0, 8).map((n) => (
              <div
                key={n.id}
                className={`flex gap-3 px-4 py-3.5 transition-colors hover:bg-hover ${!n.is_read ? "bg-brand/[0.03]" : ""}`}
              >
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${!n.is_read ? "bg-brand-light" : "bg-hover"}`}>
                  {typeIcon(n.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!n.is_read ? "font-bold text-ink" : "font-medium text-muted"}`}>
                      {n.title}
                    </p>
                    <span className="shrink-0 text-[10px] font-medium text-muted/70 whitespace-nowrap mt-0.5">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        <button
          onClick={() => setActiveView("activity")}
          className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
        >
          See all activity <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}
