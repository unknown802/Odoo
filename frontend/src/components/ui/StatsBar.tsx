import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

export interface StatItem {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  accentBorder?: string;
}

interface StatsBarProps {
  stats: StatItem[];
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
} as const;

export function StatsBar({ stats, className }: StatsBarProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6", className)}
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div key={stat.label} variants={itemVariants}>
            <div
              className={cn(
                "card-enterprise flex items-center gap-4 p-4",
                stat.accentBorder && `border-t-2 ${stat.accentBorder}`
              )}
            >
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", stat.iconBg)}>
                <Icon className={cn("h-5 w-5", stat.iconColor)} aria-hidden="true" />
              </div>
              <div>
                <div className="text-2xl font-extrabold tracking-tight text-ink count-animate">
                  {stat.value}
                </div>
                <div className="mt-0.5 text-xs font-semibold text-muted uppercase tracking-wider leading-tight">
                  {stat.label}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
