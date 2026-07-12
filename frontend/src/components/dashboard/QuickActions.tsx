import { motion } from "framer-motion";
import { PackagePlus, CalendarClock, Wrench, Repeat2, ArrowRight } from "lucide-react";
import { Card } from "../ui/Card";
import type { ViewKey } from "../../types";

interface QuickActionsProps {
  setActiveView: (view: ViewKey) => void;
}

export function QuickActions({ setActiveView }: QuickActionsProps) {
  const actions = [
    {
      title: "Register Asset",
      description: "Add a new asset to the directory",
      icon: PackagePlus,
      view: "assets" as ViewKey,
      color: "text-blue-600",
      bg: "bg-blue-100",
      borderColor: "group-hover:border-blue-300"
    },
    {
      title: "Book Resource",
      description: "Reserve an asset for a specific time",
      icon: CalendarClock,
      view: "bookings" as ViewKey,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
      borderColor: "group-hover:border-indigo-300"
    },
    {
      title: "Raise Maintenance",
      description: "Report an issue or schedule repair",
      icon: Wrench,
      view: "maintenance" as ViewKey,
      color: "text-amber-600",
      bg: "bg-amber-100",
      borderColor: "group-hover:border-amber-300"
    },
    {
      title: "Review Transfers",
      description: "Approve or reject pending requests",
      icon: Repeat2,
      view: "allocation" as ViewKey,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      borderColor: "group-hover:border-emerald-300"
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 400, damping: 30 } }
  };

  return (
    <Card className="flex flex-col h-full p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
        <p className="text-sm text-slate-500">Frequently used tools</p>
      </div>
      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show" 
        className="grid gap-3 flex-1"
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.title}
              variants={item}
              onClick={() => setActiveView(action.view)}
              className={`group relative flex w-full items-center justify-between rounded-md border border-slate-200 bg-white p-3 text-left transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${action.borderColor}`}
            >
              <div className="flex items-center gap-4">
                <div className={`grid h-10 w-10 place-items-center rounded-md ${action.bg}`}>
                  <Icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{action.title}</div>
                  <div className="text-xs text-slate-500">{action.description}</div>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:bg-slate-100 group-hover:text-slate-700 group-hover:opacity-100">
                <ArrowRight className="h-4 w-4" />
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </Card>
  );
}
