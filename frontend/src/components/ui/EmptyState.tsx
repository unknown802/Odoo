import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center py-12 text-center", className)}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-hover text-muted mb-4">
        <Icon className="h-6 w-6 opacity-70" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-muted max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
