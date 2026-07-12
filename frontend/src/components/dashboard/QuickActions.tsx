import { motion } from "framer-motion";
import { PackagePlus, CalendarClock, Wrench, Repeat2, ChevronRight } from "lucide-react";
import { Card } from "../ui/Card";
import type { ViewKey } from "../../types";

interface QuickActionsProps {
  setActiveView: (view: ViewKey) => void;
}

const actions = [
  {
    title: "Register Asset",
    description: "Add new to directory",
    icon: PackagePlus,
    view: "assets" as ViewKey,
    color: "text-brand",
    bg: "bg-brand-muted group-hover:bg-brand-light",
    border: "hover:border-brand/30",
    badge: undefined,
  },
  {
    title: "Book Resource",
    description: "Reserve for a time slot",
    icon: CalendarClock,
    view: "bookings" as ViewKey,
    color: "text-violet-600",
    bg: "bg-violet-50 group-hover:bg-violet-100",
    border: "hover:border-violet-200",
    badge: undefined,
  },
  {
    title: "Raise Maintenance",
    description: "Report issue or schedule",
    icon: Wrench,
    view: "maintenance" as ViewKey,
    color: "text-warning-dark",
    bg: "bg-warning-muted group-hover:bg-warning-soft",
    border: "hover:border-warning/30",
    badge: undefined,
  },
  {
    title: "Review Transfers",
    description: "Approve pending requests",
    icon: Repeat2,
    view: "allocation" as ViewKey,
    color: "text-success-dark",
    bg: "bg-success-muted group-hover:bg-success-soft",
    border: "hover:border-success/30",
    badge: undefined,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariant = {
  hidden: { opacity: 0, x: 8 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 380, damping: 28 } },
};

export function QuickActions({ setActiveView }: QuickActionsProps) {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="mb-4">
        <h3 className="text-card-title text-ink">Quick Actions</h3>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-1 flex-col gap-2"
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.title}
              variants={itemVariant}
              onClick={() => setActiveView(action.view)}
              aria-label={action.title}
              className={`group flex w-full items-center gap-3 rounded-[10px] border border-border p-3 text-left transition-all duration-200 hover:shadow-sm focus-ring ${action.border}`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] transition-colors duration-200 ${action.bg}`}
              >
                <Icon className={`h-4 w-4 ${action.color}`} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink leading-tight">{action.title}</div>
                <div className="text-xs text-muted mt-0.5 leading-tight">{action.description}</div>
              </div>
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </motion.button>
          );
        })}
      </motion.div>
    </Card>
  );
}
