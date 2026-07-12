import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
  pagination?: PaginationProps;
}

export function DataTable({ children, className, isEmpty, emptyState, pagination }: DataTableProps) {
  if (isEmpty && emptyState) {
    return (
      <div className={cn("card-enterprise", className)}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={cn("table-shell", className)}>
      <table>
        {children}
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border bg-surface px-5 py-3">
          <p className="text-xs text-muted">
            Showing{" "}
            <span className="font-semibold text-ink">
              {(pagination.currentPage - 1) * pagination.pageSize + 1}–
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
            </span>{" "}
            of <span className="font-semibold text-ink">{pagination.totalItems}</span> results
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-hover hover:text-ink disabled:pointer-events-none disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.currentPage) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => pagination.onPageChange(p as number)}
                    className={cn(
                      "flex h-7 min-w-[28px] items-center justify-center rounded-lg border text-xs font-medium transition-colors",
                      pagination.currentPage === p
                        ? "border-brand bg-brand text-white"
                        : "border-border text-muted hover:bg-hover hover:text-ink"
                    )}
                  >
                    {p}
                  </button>
                )
              )
            }

            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-hover hover:text-ink disabled:pointer-events-none disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
