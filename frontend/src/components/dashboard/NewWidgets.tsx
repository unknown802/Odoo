import { AlertTriangle, BellRing, ChevronRight, FileText, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import type { Asset, MaintenanceRequest, NotificationItem, Profile, TransferRequest } from "../../types";
import { formatDate } from "../../lib/utils";

export function OrganizationHealthWidget() {
  return (
    <Card className="flex flex-col p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-lg relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-32 w-32 rounded-full bg-brand/20 blur-2xl"></div>
      
      <div className="relative z-10 flex items-center gap-3 mb-4">
        <div className="rounded-md bg-white/10 p-2 backdrop-blur-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold">Organization Health</h3>
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center">
        <div className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">
          98<span className="text-2xl">%</span>
        </div>
        <p className="text-slate-400 text-sm mt-2 font-medium">System operating optimally</p>
      </div>
      
      <div className="relative z-10 mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Uptime</div>
          <div className="text-sm font-bold mt-1 text-slate-200">99.99%</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Security</div>
          <div className="text-sm font-bold mt-1 text-slate-200">Passing</div>
        </div>
      </div>
    </Card>
  );
}

export function PendingApprovalsWidget({
  transfers,
  assets,
  profiles
}: {
  transfers: TransferRequest[];
  assets: Asset[];
  profiles: Profile[];
}) {
  const pending = transfers.filter(t => t.status === "Requested");
  
  return (
    <Card className="flex flex-col p-0 overflow-hidden h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-400" />
          <h3 className="font-bold text-slate-800">Pending Approvals</h3>
        </div>
        <Badge tone={pending.length > 0 ? "warning" : "info"}>{pending.length}</Badge>
      </div>
      <div className="p-2 flex-1 overflow-y-auto">
        {pending.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-sm text-slate-400">
            No pending approvals
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {pending.slice(0, 4).map(t => {
              const asset = assets.find((candidate) => candidate.id === t.asset_id);
              const fromHolder = profiles.find((candidate) => candidate.id === t.from_holder_id);
              const toHolder = profiles.find((candidate) => candidate.id === t.to_holder_id);
              return (
              <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700">{asset?.asset_tag ?? "Asset"} transfer</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {fromHolder?.full_name ?? "Unassigned"} to {toHolder?.full_name ?? "Unassigned"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

export function MaintenanceAlertsWidget({ maintenance, assets }: { maintenance: MaintenanceRequest[]; assets: Asset[] }) {
  const activeAlerts = maintenance.filter(m => m.status === "In_Progress" || m.priority === "High");
  
  return (
    <Card className="flex flex-col p-0 overflow-hidden h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-400" />
          <h3 className="font-bold text-slate-800">Maintenance Alerts</h3>
        </div>
        {activeAlerts.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
            {activeAlerts.length}
          </span>
        )}
      </div>
      <div className="p-2 flex-1 overflow-y-auto">
        {activeAlerts.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-sm text-slate-400">
            System running smoothly
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {activeAlerts.slice(0, 4).map(m => {
              const asset = assets.find((candidate) => candidate.id === m.asset_id);
              return (
              <div key={m.id} className="flex gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                <div className="mt-0.5">
                  <AlertTriangle className={`h-4 w-4 ${m.priority === 'High' ? 'text-rose-500' : 'text-amber-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{m.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                    {asset?.asset_tag ? `${asset.asset_tag} - ` : ""}{m.description}
                  </p>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

export function RecentNotificationsWidget({ notifications }: { notifications: NotificationItem[] }) {
  return (
    <Card className="flex flex-col p-0 overflow-hidden h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-slate-400" />
          <h3 className="font-bold text-slate-800">Recent Notifications</h3>
        </div>
      </div>
      <div className="p-2 flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-sm text-slate-400">
            No recent notifications
          </div>
        ) : (
          <div className="flex flex-col relative before:absolute before:inset-y-2 before:left-[19px] before:w-[2px] before:bg-slate-100 pl-2">
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} className="relative flex gap-4 p-2">
                <div className={`mt-1 h-3 w-3 rounded-full border-2 border-white shadow-sm z-10 ${!n.is_read ? 'bg-brand' : 'bg-slate-300'}`}></div>
                <div className="flex-1 min-w-0 bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:shadow transition-shadow">
                  <p className="text-sm font-semibold text-slate-700">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-wider">{formatDate(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
