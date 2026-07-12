import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: React.ReactNode;
  iconBg?: string;
  isRead?: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
};

export function Timeline({ items, className }: TimelineProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn("relative", className)}
    >
      <div className="absolute bottom-0 left-[19px] top-4 w-px bg-border/60" aria-hidden="true" />
      
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <motion.div key={item.id} variants={itemVariants} className="relative flex gap-4 group">
            <div
              className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] border-surface transition-colors",
                item.iconBg || "bg-hover text-muted",
                !item.isRead && "ring-2 ring-brand/20 ring-offset-2 ring-offset-surface"
              )}
            >
              {item.icon}
            </div>
            <div className="flex flex-col pb-2 pt-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn("text-sm leading-snug", !item.isRead ? "font-bold text-ink" : "font-medium text-ink")}>
                  {item.title}
                </p>
                <span className="shrink-0 text-xs font-medium text-muted whitespace-nowrap">
                  {item.timestamp}
                </span>
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-muted break-words">
                  {item.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
