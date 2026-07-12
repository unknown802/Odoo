import { cn } from "../../lib/utils";

const tones = {
  success: "bg-success-soft text-success-dark ring-1 ring-success/20",
  info: "bg-brand-light text-brand-dark ring-1 ring-brand/20",
  warning: "bg-warning-soft text-warning-dark ring-1 ring-warning/20",
  danger: "bg-danger-soft text-danger-dark ring-1 ring-danger/20",
  neutral: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-badge px-2 py-0.5 text-xs font-semibold tracking-tight",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
