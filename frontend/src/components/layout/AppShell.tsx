import { motion } from "framer-motion";
import { Bell, Building2, CircleUserRound, Menu, Search, Settings, X } from "lucide-react";
import { useState } from "react";
import { navItems, roleLabels } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { useNotifications } from "../../hooks/useNotifications";
import { useRealtimeNotifications } from "../../hooks/useRealtime";
import { useAssetFlowStore } from "../../store/assetFlowStore";
import type { Role } from "../../types";
import { Button } from "../ui/Button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeView = useAssetFlowStore((state) => state.activeView);
  const setActiveView = useAssetFlowStore((state) => state.setActiveView);
  const currentRole = useAssetFlowStore((state) => state.currentRole);
  const setCurrentRole = useAssetFlowStore((state) => state.setCurrentRole);
  const currentUserId = useAssetFlowStore((state) => state.currentUserId);
  const profiles = useAssetFlowStore((state) => state.profiles);
  const profile = profiles.find((candidate) => candidate.id === currentUserId);
  const { data: notifications = [] } = useNotifications(currentUserId);
  const unread = notifications.filter((notification) => !notification.is_read).length;

  useRealtimeNotifications(currentUserId);

  const visibleItems = navItems.filter((item) => item.roles.includes(currentRole));
  const currentDate = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date());
  const currentItem = visibleItems.find((item) => item.key === activeView);
  const mobileTitle = currentItem?.label === "Notifications & Logs" ? "Notifications" : currentItem?.label ?? "Dashboard";
  const renderNav = (isMobile = false) =>
    visibleItems.map((item) => {
      const Icon = item.icon;
      const isActive = activeView === item.key;
      return (
        <button
          key={item.key}
          className={cn(
            "focus-ring group relative flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition-all duration-200",
            isActive ? "text-brand-dark" : "text-muted hover:bg-slate-100 hover:text-ink"
          )}
          onClick={() => {
            setActiveView(item.key);
            if (isMobile) setMobileOpen(false);
          }}
        >
          {isActive && (
            <motion.div
              layoutId={isMobile ? "mobile-sidebar-active-pill" : "sidebar-active-pill"}
              className="absolute inset-0 rounded-md bg-brand-light"
              initial={false}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}
          <span className="relative z-10 grid h-5 w-5 place-items-center">
            <Icon className={cn("h-4 w-4 transition", isActive ? "text-brand" : "group-hover:text-ink")} />
          </span>
          <span className="relative z-10">{item.label}</span>
        </button>
      );
    });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-ink selection:bg-brand/20">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] border-r border-border bg-surface shadow-[1px_0_10px_rgba(0,0,0,0.02)] lg:flex lg:flex-col">
        <div className="flex h-16 shrink-0 items-center gap-3 px-6">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-brand text-sm font-black text-white shadow-sm ring-1 ring-brand-dark/20">AF</div>
          <div>
            <div className="font-bold leading-none tracking-tight text-ink">AssetFlow</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted">Enterprise</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          <div className="mb-2 px-2 text-xs font-bold uppercase tracking-normal text-muted/70">Operations</div>
          {renderNav()}
        </nav>
        <div className="border-t border-border/70 p-4">
          <button className="group flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-slate-100">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 ring-1 ring-border transition group-hover:ring-brand/30">
              <CircleUserRound className="h-5 w-5 text-muted group-hover:text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{profile?.full_name}</p>
              <p className="truncate text-xs font-medium text-muted">{profile?.role.replace("_", " ")}</p>
            </div>
            <Settings className="h-4 w-4 text-muted/50 transition group-hover:text-muted" />
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-72 border-r border-border bg-white shadow-soft">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-brand text-sm font-black text-white">AF</div>
                <div>
                  <div className="font-bold">AssetFlow</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Enterprise</div>
                </div>
              </div>
              <Button variant="ghost" className="h-10 w-10 px-0" title="Close navigation" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="grid gap-1 p-3">{renderNav(true)}</nav>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-surface/85 px-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] backdrop-blur-xl md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Button className="lg:hidden" variant="ghost" title="Menu" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden min-w-0 flex-1 lg:block">
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search assets, employees..."
                  className="focus-ring h-10 w-full rounded-md border border-transparent bg-slate-100 pl-10 pr-4 text-sm outline-none transition hover:bg-slate-200/60 focus:border-brand/30 focus:bg-white"
                />
              </div>
            </div>
            <div className="shrink-0 lg:hidden">
              <h1 className="max-w-32 truncate text-base font-bold sm:max-w-none">{mobileTitle}</h1>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <div className="hidden h-10 items-center gap-2 rounded-md border border-border/70 bg-slate-100 px-3 text-sm font-semibold text-ink transition hover:bg-slate-200/60 sm:flex">
              <Building2 className="h-4 w-4 text-muted" />
              <span>AssetFlow HQ</span>
            </div>
            <label className="sr-only" htmlFor="role-switcher">
              Role
            </label>
            <select
              id="role-switcher"
              className="focus-ring h-10 rounded-md border border-border/70 bg-surface px-3 text-sm font-bold text-ink shadow-sm transition hover:bg-slate-100"
              value={currentRole}
              onChange={(event) => {
                const nextRole = event.target.value as Role;
                setCurrentRole(nextRole);
                const currentItem = navItems.find((item) => item.key === activeView);
                if (currentItem && !currentItem.roles.includes(nextRole)) {
                  setActiveView("dashboard");
                }
              }}
            >
              {Object.entries(roleLabels).map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
            </select>
            <button
              title="Notifications"
              onClick={() => setActiveView("activity")}
              className="relative flex h-10 w-10 items-center justify-center rounded-md text-muted transition hover:bg-slate-100 hover:text-ink"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 md:p-6 lg:p-8">
          <div className="mb-8 hidden lg:block">
            <h1 className="text-3xl font-bold tracking-normal text-ink">Welcome back, {profile?.full_name?.split(" ")[0] ?? "User"}</h1>
            <p className="mt-1 text-sm font-medium text-muted">{currentDate}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
