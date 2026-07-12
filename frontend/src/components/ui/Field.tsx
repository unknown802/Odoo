import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-semibold text-slate-700">{children}</label>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("focus-ring h-10 rounded-md border border-border bg-white px-3 text-sm", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("focus-ring h-10 rounded-md border border-border bg-white px-3 text-sm", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("focus-ring min-h-24 rounded-md border border-border bg-white px-3 py-2 text-sm", props.className)} />;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
