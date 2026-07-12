import { AlertTriangle, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  danger: "border-rose-200 bg-rose-50 text-rose-800"
};

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  danger: AlertCircle
};

export function Notice({ message, tone = "info" }: { message: string; tone?: keyof typeof styles }) {
  const Icon = icons[tone];
  return (
    <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium", styles[tone])}>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
