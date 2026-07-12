import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Menu, Search, Building2, Moon, Sun, Settings, X, LogOut } from "lucide-react";
import { navItems, roleLabels } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { useNotifications } from "../../hooks/useNotifications";
import { useRealtimeNotifications } from "../../hooks/useRealtime";
import { useOrg } from "../../hooks/useApi";
import { useAssetFlowStore } from "../../store/assetFlowStore";
import type { ViewKey } from "../../types";

// ── Nav group definitions ────────────────────────────────────────────────────
const NAV_GROUPS: { label: string; keys: ViewKey[] }[] = [
  { label: "Overview",    keys: ["dashboard", "auth"] },
  { label: "Operations",  keys: ["assets", "allocation", "bookings", "maintenance"] },
  { label: "Management",  keys: ["organization", "audits", "reports", "activity"] },
];

// ── User initials avatar ─────────────────────────────────────────────────────
function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  // Derive a consistent color from the name
  const colors = [
    "bg-brand text-white",
    "bg-success text-white",
    "bg-warning text-white",
    "bg-violet-500 text-white",
    "bg-pink-500 text-white",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={cn("flex items-center justify-center rounded-full text-xs font-bold", color, className)}>
      {initials}
    </div>
  );
}

// ── Command Palette (⌘K) ─────────────────────────────────────────────────────
function CommandPalette({
  open,
  onClose,
  setActiveView,
  visibleItems,
}: {
  open: boolean;
  onClose: () => void;
  setActiveView: (v: ViewKey) => void;
  visibleItems: typeof navItems;
}) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? visibleItems.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : visibleItems;

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search views..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-hover hover:text-ink transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Results */}
        <div className="max-h-64 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">No results found</p>
          ) : (
            filtered.map((nav) => {
              const Icon = nav.icon;
              return (
                <button
                  key={nav.key}
                  onClick={() => { setActiveView(nav.key); onClose(); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-hover transition-colors"
                >
                  <Icon className="h-4 w-4 text-muted" />
                  <span className="font-medium text-ink">{nav.label}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="border-t border-border px-4 py-2 flex items-center gap-3">
          <kbd className="text-[10px] font-mono text-muted">↑↓ navigate</kbd>
          <kbd className="text-[10px] font-mono text-muted">↵ select</kbd>
          <kbd className="text-[10px] font-mono text-muted">esc close</kbd>
        </div>
      </motion.div>
    </div>
  );
}

// ── AppShell ─────────────────────────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  // Theme
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("af-theme") === "dark"; } catch { return false; }
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("af-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("af-theme", "light");
    }
  }, [isDark]);

  // Command palette
  const [cmdOpen, setCmdOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setCmdOpen((v) => !v);
    }
    if (e.key === "Escape") setCmdOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Store
  const activeView = useAssetFlowStore((s) => s.activeView);
  const setActiveView = useAssetFlowStore((s) => s.setActiveView);
  const session = useAssetFlowStore((s) => s.session);
  const logout = useAssetFlowStore((s) => s.logout);
  
  // Local role state for UI controls (defaults to session role)
  const [currentRole, setCurrentRole] = useState<string>(session?.role ?? "Admin");

  // Org data
  const { data: orgData } = useOrg();
  const profiles = orgData?.profiles ?? [];
  
  // If session is available use it; otherwise fall back to first Admin in org
  const profile = session ?? profiles.find((p) => p.role === "Admin") ?? profiles[0];
  const displayName = profile?.full_name ?? "User";
  const displayRole = session?.role ?? (profile as any)?.role ?? "Employee";
  
  // Notifications (global for current user placeholder)
  const { data: notifications = [] } = useNotifications();
  const unread = notifications.filter((n) => !n.is_read).length;

  useRealtimeNotifications(profile?.id ?? "");

  const visibleItems = navItems.filter((item) => item.roles.includes(currentRole as any));
  const currentDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long", month: "long", day: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-background text-ink selection:bg-brand/20">
      <AnimatePresence>
        {cmdOpen && (
          <CommandPalette
            open={cmdOpen}
            onClose={() => setCmdOpen(false)}
            setActiveView={setActiveView}
            visibleItems={visibleItems}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside
        className="fixed inset-y-0 left-0 hidden w-[252px] flex-col border-r border-border bg-surface lg:flex"
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-[11px] font-black text-white shadow-sm">
            AF
          </div>
          <div>
            <div className="text-sm font-bold text-ink tracking-tight leading-none">AssetFlow</div>
            <div className="text-[9px] font-bold tracking-[0.12em] text-muted uppercase mt-1">Enterprise</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group) => {
            const groupItems = visibleItems.filter((item) =>
              group.keys.includes(item.key)
            );
            if (groupItems.length === 0) return null;

            return (
              <div key={group.label}>
                <div className="mb-1 px-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted/60">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {groupItems.map((navItem) => {
                    const Icon = navItem.icon;
                    const isActive = activeView === navItem.key;
                    return (
                      <button
                        key={navItem.key}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group relative flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-sm font-semibold transition-all duration-150",
                          isActive
                            ? "nav-active text-brand"
                            : "text-muted hover:bg-hover hover:text-ink"
                        )}
                        onClick={() => setActiveView(navItem.key)}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-indicator"
                            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-all duration-150",
                            isActive
                              ? "text-brand"
                              : "text-slate-400 group-hover:text-ink group-hover:scale-110"
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">{navItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="border-t border-border/60 p-3">
          <button className="group flex w-full items-center gap-3 rounded-[10px] p-2 transition-colors hover:bg-hover" onClick={logout}>
            <Avatar name={displayName} className="h-8 w-8 shrink-0 text-[11px]" />
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-bold text-ink">{displayName}</div>
              <div className="truncate text-xs text-muted">{displayRole.replace("_", " ")}</div>
            </div>
            <LogOut className="h-3.5 w-3.5 text-muted/50 transition-colors group-hover:text-danger" aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="lg:pl-[252px] flex flex-col min-h-screen">
        {/* Header */}
        <header
          className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-surface/80 px-4 backdrop-blur-xl md:px-6 shadow-sm"
          role="banner"
        >
          {/* Left: mobile menu + search */}
          <div className="flex flex-1 items-center gap-3">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-[10px] text-muted hover:bg-hover hover:text-ink transition-colors lg:hidden"
              title="Menu"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Search trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              aria-label="Open command palette (⌘K)"
              className="flex h-9 w-full max-w-sm items-center gap-2.5 rounded-[10px] border border-border bg-hover px-3 text-left text-sm text-muted transition-all hover:border-brand/30 hover:bg-surface hover:text-ink hover:shadow-sm"
            >
              <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="flex-1 text-sm">Search or press</span>
              <kbd className="hidden shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted sm:block">⌘K</kbd>
            </button>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-1.5 ml-3">
            {/* Company */}
            <div className="hidden h-8 items-center gap-2 rounded-[10px] border border-border bg-hover px-3 text-xs font-semibold text-ink sm:flex">
              <Building2 className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <span>Acme Corp</span>
            </div>

            {/* Role switcher */}
            <label className="sr-only" htmlFor="role-switcher">Switch role</label>
            <select
              id="role-switcher"
              className="focus-ring h-8 rounded-[10px] border border-border bg-surface px-2.5 text-xs font-bold text-ink transition-all hover:bg-hover outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
            >
              {Object.entries(roleLabels).map(([role, label]) => (
                <option key={role} value={role}>{label}</option>
              ))}
            </select>

            <div className="h-5 w-px bg-border mx-0.5 hidden sm:block" />

            {/* Dark mode */}
            <button
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setIsDark(!isDark)}
              className="flex h-8 w-8 items-center justify-center rounded-[10px] text-muted hover:bg-hover hover:text-ink transition-colors"
            >
              {isDark
                ? <Sun className="h-4 w-4" aria-hidden="true" />
                : <Moon className="h-4 w-4" aria-hidden="true" />
              }
            </button>

            {/* Notifications */}
            <button
              title="Notifications"
              aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
              onClick={() => setActiveView("activity")}
              className="relative flex h-8 w-8 items-center justify-center rounded-[10px] text-muted hover:bg-hover hover:text-ink transition-colors"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-danger ring-2 ring-surface animate-pulse-subtle" aria-hidden="true" />
              )}
            </button>

            {/* Avatar */}
            <button
              title="User settings"
              aria-label="User profile"
              className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-border hover:ring-brand/40 transition-all"
            >
              <Avatar name={displayName} className="h-8 w-8 text-[10px]" />
            </button>
          </div>
        </header>

        {/* Main */}
        <main
          className="flex-1 w-full max-w-[1600px] mx-auto px-4 pt-4 pb-12 md:px-6 lg:px-8"
          role="main"
          aria-label="Dashboard content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
