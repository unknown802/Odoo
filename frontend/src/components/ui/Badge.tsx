import { cn } from "../../lib/utils";

const tones = {
  success: "bg-success-soft text-success ring-success/20",
  info: "bg-brand-light text-brand ring-brand/20",
  warning: "bg-warning-soft text-warning ring-warning/20",
  danger: "bg-danger-soft text-danger ring-danger/20",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200"
};

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", tones[tone], className)}>{children}</span>;
}
