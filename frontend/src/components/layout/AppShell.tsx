import { Bell, CircleUserRound, Menu, X } from "lucide-react";
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
  const renderNav = (isMobile = false) =>
    visibleItems.map((item) => {
      const Icon = item.icon;
      return (
        <button
          key={item.key}
          className={cn(
            "focus-ring flex min-h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50",
            activeView === item.key && "bg-brand-light text-brand-dark"
          )}
          onClick={() => {
            setActiveView(item.key);
            if (isMobile) setMobileOpen(false);
          }}
        >
          <Icon className="h-4 w-4" />
          {item.label}
        </button>
      );
    });

  return (
    <div className="min-h-screen bg-[#f7faf9] text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-brand text-base font-black text-white">AF</div>
          <div>
            <div className="font-bold">AssetFlow</div>
            <div className="text-xs text-muted">Enterprise</div>
          </div>
        </div>
        <nav className="grid gap-1 p-3">{renderNav()}</nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-72 border-r border-border bg-white shadow-soft">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-brand text-base font-black text-white">AF</div>
                <div>
                  <div className="font-bold">AssetFlow</div>
                  <div className="text-xs text-muted">Enterprise</div>
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

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button className="lg:hidden" variant="ghost" title="Menu" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold md:text-xl">{visibleItems.find((item) => item.key === activeView)?.label ?? "Dashboard"}</h1>
              <p className="hidden text-sm text-muted sm:block">{profile?.full_name} running as {roleLabels[currentRole]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="role-switcher">
              Role
            </label>
            <select
              id="role-switcher"
              className="focus-ring h-10 rounded-md border border-border bg-white px-2 text-sm font-semibold"
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
            <Button variant="secondary" title="Notifications" onClick={() => setActiveView("activity")} className="relative h-10 w-10 px-0">
              <Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] text-white">{unread}</span>}
            </Button>
            <Button variant="ghost" title="Profile" className="h-10 w-10 px-0">
              <CircleUserRound className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 md:px-6">{children}</main>
      </div>
    </div>
  );
}
