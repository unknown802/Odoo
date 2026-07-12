import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-xs hover:bg-brand-dark hover:shadow-sm",
  secondary:
    "border border-border bg-surface text-ink shadow-xs hover:bg-hover hover:border-hover-strong",
  ghost:
    "text-muted hover:bg-hover hover:text-ink",
  danger:
    "bg-danger text-white shadow-xs hover:bg-danger-dark hover:shadow-sm",
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-btn px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
