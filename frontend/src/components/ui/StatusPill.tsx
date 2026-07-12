import { cn, statusTone } from "../../lib/utils";

interface StatusPillProps {
  status: string;
  className?: string;
}

const toneStyles = {
  success: "bg-success-soft text-success-dark border border-success/20",
  info: "bg-brand-light text-brand-dark border border-brand/20",
  warning: "bg-warning-soft text-warning-dark border border-warning/20",
  danger: "bg-danger-soft text-danger-dark border border-danger/20",
  neutral: "bg-slate-100 text-slate-600 border border-slate-200",
};

const dotColors = {
  success: "bg-success",
  info: "bg-brand",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-slate-400",
};

export function StatusPill({ status, className }: StatusPillProps) {
  const tone = statusTone(status) as keyof typeof toneStyles;
  const displayLabel = status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold tracking-tight",
        toneStyles[tone],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[tone])} aria-hidden="true" />
      {displayLabel}
    </span>
  );
}
