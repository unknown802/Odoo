import { cn } from "../../lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-md border border-border bg-white p-4 shadow-sm", className)}>{children}</section>;
}
