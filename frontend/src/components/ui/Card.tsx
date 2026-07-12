import { cn } from "../../lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        "card-enterprise overflow-hidden",
        className
      )}
    >
      {children}
    </section>
  );
}
