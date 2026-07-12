import { CheckCheck, Bell, Activity, Filter, Search, Clock, History, CircleUser } from "lucide-react";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Input } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonCard, SkeletonTable } from "../components/ui/Skeleton";
import { StatusPill } from "../components/ui/StatusPill";
import { formatDate, statusTone } from "../lib/utils";
import { useNotifications, useMarkAllNotificationsRead } from "../hooks/useNotifications";
import { useOrg } from "../hooks/useApi";
import { useActivityLogs } from "../hooks/useApi";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
};

export function ActivityLogs() {
  const { data: notifications = [], isLoading: loadingNotifications } = useNotifications();
  const { data: activityLogs = [], isLoading: loadingLogs } = useActivityLogs();
  const { data: orgData, isLoading: loadingOrg } = useOrg();
  const markAllRead = useMarkAllNotificationsRead();
  const [logFilter, setLogFilter] = useState("");
  const [notifFilter, setNotifFilter] = useState("All");

  const profiles = orgData?.profiles ?? [];

  const filteredLogs = useMemo(
    () => activityLogs.filter((log) => 
      !logFilter || 
      log.action.toLowerCase().includes(logFilter.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(logFilter.toLowerCase()) ||
      (profiles.find(p => p.id === log.user_id)?.full_name.toLowerCase().includes(logFilter.toLowerCase()))
    ),
    [activityLogs, logFilter, profiles]
  );

  const filteredNotifs = useMemo(
    () => notifications.filter((n) => notifFilter === "All" || n.type === notifFilter),
    [notifications, notifFilter]
  );

  const notifTypes = useMemo(() => ["All", ...Array.from(new Set(notifications.map(n => n.type)))], [notifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loadingNotifications || loadingLogs || loadingOrg) {
    return (
      <div className="space-y-6">
        <PageHeader title="Activity & Notifications" subtitle="Monitor system events and alerts." />
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonTable rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Activity & Notifications" 
        subtitle="Monitor system events, user actions, and important alerts."
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr] items-start"
      >
        <motion.div variants={fadeUp} className="flex flex-col gap-5">
          <Card className="flex flex-col p-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-ink" />
                <h2 className="text-base font-bold text-ink">Notifications</h2>
                {unreadCount > 0 && (
                  <Badge tone="danger" className="ml-2 animate-pulse">{unreadCount} New</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={notifFilter} 
                  onChange={(e) => setNotifFilter(e.target.value)}
                  className="h-8 rounded-lg border border-border bg-surface px-2 py-1 text-xs font-medium text-ink outline-none focus:ring-1 focus:ring-brand mr-2"
                >
                  {notifTypes.map(t => <option key={t} value={t}>{t} Notifications</option>)}
                </select>
                <Button 
                  variant="secondary" 
                  onClick={() => markAllRead.mutate()} 
                  disabled={markAllRead.isPending || unreadCount === 0} 
                  title="Mark all read"
                  className="h-8 text-xs px-2.5"
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" /> {markAllRead.isPending ? "Marking…" : "Mark All Read"}
                </Button>
              </div>
            </div>
            
            <div className="p-0 bg-surface flex flex-col min-h-[300px] max-h-[600px] overflow-y-auto">
              {filteredNotifs.length === 0 ? (
                <EmptyState icon={Bell} title="All caught up" description="You have no notifications matching this filter." className="my-auto py-12" />
              ) : (
                <div className="divide-y divide-border">
                  <AnimatePresence>
                    {filteredNotifs.map((notification) => (
                      <motion.article 
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`p-4 transition-colors hover:bg-slate-50 ${!notification.is_read ? 'bg-brand/5 border-l-2 border-l-brand' : 'border-l-2 border-l-transparent'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className={`font-semibold text-sm ${!notification.is_read ? 'text-ink' : 'text-slate-700'}`}>
                              {notification.title}
                            </div>
                            <div className="mt-1 text-xs text-muted leading-relaxed">
                              {notification.message}
                            </div>
                          </div>
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-brand shrink-0 mt-1.5" />
                          )}
                        </div>
                      </motion.article>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-col gap-5">
          <Card className="p-4 bg-slate-50 border-border/60">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input 
                type="text" 
                value={logFilter} 
                onChange={(e) => setLogFilter(e.target.value)} 
                placeholder="Search by action, entity, or user..." 
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
              {logFilter && (
                <button 
                  onClick={() => setLogFilter("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-brand hover:text-brand-dark"
                >
                  Clear
                </button>
              )}
            </div>
          </Card>

          <Card className="flex flex-col p-0 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-slate-50">
              <History className="h-5 w-5 text-ink" />
              <h3 className="text-sm font-bold text-ink">System Activity Log</h3>
            </div>
            
            <DataTable
              className="border-0 rounded-none shadow-none"
              isEmpty={filteredLogs.length === 0}
              emptyState={
                <EmptyState 
                  icon={Activity} 
                  title="No activity found" 
                  description={logFilter ? "Try adjusting your search terms." : "System activity logs will appear here."} 
                />
              }
            >
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const user = profiles.find((p) => p.id === log.user_id);
                  return (
                    <tr key={log.id} className="hover:bg-hover transition-colors">
                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-ink font-medium">
                          <Clock className="h-3.5 w-3.5 text-muted" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center border border-border">
                            {user ? (
                              <span className="text-[10px] font-bold text-slate-600">{user.full_name.charAt(0)}</span>
                            ) : (
                              <CircleUser className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-ink">{user?.full_name ?? "System"}</span>
                        </div>
                      </td>
                      <td>
                        <Badge tone={statusTone(log.action)} className="capitalize px-2 py-0.5">
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-xs font-mono px-2 py-1 bg-slate-50 rounded-md border border-border/50 text-slate-600 capitalize">
                          {log.entity_type}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
