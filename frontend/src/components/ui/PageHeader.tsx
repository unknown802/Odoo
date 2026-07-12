import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
} as const;

export function PageHeader({ title, subtitle, children, className }: PageHeaderProps) {
  return (
    <motion.div
      variants={headerVariants}
      initial="hidden"
      animate="show"
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6", className)}
    >
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </motion.div>
  );
}
