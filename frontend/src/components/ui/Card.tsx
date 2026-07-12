import { cn } from "../../lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-2xl border border-border bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200", className)}>{children}</section>;
}
