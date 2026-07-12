import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function TabBar({ tabs, activeTab, onTabChange, className }: TabBarProps) {
  return (
    <div className={cn("flex items-center gap-1 border-b border-border mb-6", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative px-4 py-2.5 text-sm font-semibold transition-colors focus-ring outline-none rounded-t-lg",
            activeTab === tab.id ? "text-brand" : "text-muted hover:text-ink hover:bg-hover"
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div
              layoutId="active-tab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
