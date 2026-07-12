import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "./Utils";

const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  danger: "border-danger/30 bg-danger-soft text-red-800"
};

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  danger: AlertTriangle
};

export function Notice({
  message,
  tone = "info",
  className
}: {
  message: string;
  tone?: keyof typeof styles;
  className?: string;
}) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-md border px-3 py-2 text-sm font-medium", styles[tone], className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
