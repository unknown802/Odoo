import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function formatTimeRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

export function daysOverdue(expectedReturn?: string) {
  if (!expectedReturn) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(expectedReturn);
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86_400_000));
}

export function isOverlapping(startA: string, endA: string, startB: string, endB: string) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

export function nextAssetTag(count: number) {
  return `AF-${String(count + 1).padStart(4, "0")}`;
}

export function exportCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function statusTone(status: string) {
  if (["Available", "Verified", "Resolved", "Completed", "Active"].includes(status)) return "success";
  if (["Allocated", "Upcoming", "Approved", "In_Progress", "Reserved"].includes(status)) return "info";
  if (["Pending", "Requested", "Damaged", "Overdue"].includes(status)) return "warning";
  if (["Lost", "Rejected", "Disposed", "Under_Maintenance", "Missing", "Cancelled"].includes(status)) return "danger";
  return "neutral";
}
