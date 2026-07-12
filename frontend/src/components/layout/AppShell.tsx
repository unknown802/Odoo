import { motion } from "framer-motion";
import { Bell, CircleUserRound, Menu, Search, Building2, Moon, Settings } from "lucide-react";
import { navItems, roleLabels } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { useNotifications } from "../../hooks/useNotifications";
import { useRealtimeNotifications } from "../../hooks/useRealtime";
import { useAssetFlowStore } from "../../store/assetFlowStore";
import type { Role } from "../../types";
import { Button } from "../ui/Button";

export function AppShell({ children }: { children: React.ReactNode }) {
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
  const currentDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="min-h-screen bg-background text-ink selection:bg-brand/20">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] border-r border-border bg-surface lg:flex lg:flex-col shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        <div className="flex h-16 shrink-0 items-center gap-3 px-6">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-white shadow-sm ring-1 ring-brand-dark/20">AF</div>
          <div>
            <div className="font-bold text-ink tracking-tight leading-none">AssetFlow</div>
            <div className="text-[10px] font-bold tracking-widest text-muted uppercase mt-1">Enterprise</div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="px-2 mb-2 text-xs font-bold uppercase tracking-wider text-muted/60">Overview</div>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.key;
            
            return (
              <button
                key={item.key}
                className={cn(
                  "group relative focus-ring flex w-full min-h-10 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-all duration-200",
                  isActive 
                    ? "text-brand-dark" 
                    : "text-muted hover:bg-hover hover:text-ink"
                )}
                onClick={() => setActiveView(item.key)}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active-pill" 
                    className="absolute inset-0 rounded-xl bg-brand-light/60 mix-blend-multiply" 
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <div className="relative flex items-center justify-center w-5">
                  <Icon className={cn(
                    "h-4 w-4 transition-all duration-200", 
                    isActive ? "text-brand scale-110" : "group-hover:text-ink group-hover:scale-110"
                  )} />
                </div>
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border/50">
          <button className="group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-hover">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-1 ring-border group-hover:ring-brand/30 transition-all">
              <CircleUserRound className="h-5 w-5 text-muted group-hover:text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{profile?.full_name}</p>
              <p className="truncate text-xs font-medium text-muted">{profile?.role.replace('_', ' ')}</p>
            </div>
            <Settings className="h-4 w-4 text-muted/50 group-hover:text-muted transition-colors" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-surface/80 px-4 backdrop-blur-xl md:px-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Button className="lg:hidden" variant="ghost" title="Menu">
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="hidden min-w-0 lg:block lg:flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input 
                  type="text" 
                  placeholder="Search assets, employees..." 
                  className="h-10 w-full rounded-xl border border-transparent bg-hover pl-10 pr-4 text-sm outline-none transition-all focus:border-brand/30 focus:bg-surface focus:ring-4 focus:ring-brand/10 hover:bg-slate-200/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  <kbd className="hidden h-5 items-center justify-center rounded border border-border bg-surface px-1.5 font-mono text-[10px] font-medium text-muted sm:flex">⌘</kbd>
                  <kbd className="hidden h-5 items-center justify-center rounded border border-border bg-surface px-1.5 font-mono text-[10px] font-medium text-muted sm:flex">K</kbd>
                </div>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <div className="hidden h-10 items-center gap-2.5 rounded-xl border border-border/60 bg-hover/50 px-3.5 text-sm font-semibold text-ink sm:flex cursor-pointer hover:bg-hover transition-colors">
              <Building2 className="h-4 w-4 text-muted" />
              <span>Acme Corp</span>
            </div>

            <label className="sr-only" htmlFor="role-switcher">Role</label>
            <select
              id="role-switcher"
              className="focus-ring h-10 rounded-xl border border-border/60 bg-surface px-3.5 text-sm font-bold text-ink shadow-sm transition-all hover:bg-hover hover:border-border cursor-pointer outline-none focus:ring-4 focus:ring-brand/10"
              value={currentRole}
              onChange={(event) => setCurrentRole(event.target.value as Role)}
            >
              {Object.entries(roleLabels).map(([role, label]) => (
                <option key={role} value={role}>{label}</option>
              ))}
            </select>

            <div className="h-5 w-px bg-border mx-1 hidden sm:block"></div>

            <button title="Theme" className="flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-hover hover:text-ink transition-colors">
              <Moon className="h-[18px] w-[18px]" />
            </button>

            <button title="Notifications" onClick={() => setActiveView("activity")} className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-hover hover:text-ink transition-colors">
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute right-2 top-2 flex h-2 w-2 items-center justify-center rounded-full bg-danger ring-2 ring-surface animate-pulse"></span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
          <div className="mb-8 hidden lg:block">
            <h1 className="text-3xl font-bold tracking-tight text-ink">Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}</h1>
            <p className="text-sm font-medium text-muted mt-1">{currentDate}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
