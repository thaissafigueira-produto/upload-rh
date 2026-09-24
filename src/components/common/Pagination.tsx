import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/format";

export function Pagination({
  page, pageSize, total, onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages - 1);
  const from = current * pageSize + 1;
  const to = Math.min(total, (current + 1) * pageSize);

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <p>Mostrando {formatNumber(from)}–{formatNumber(to)} de {formatNumber(total)}</p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={current === 0}
          onClick={() => onPageChange(current - 1)}
          className="flex size-8 items-center justify-center rounded-full border border-input text-primary transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="px-2 font-medium">{current + 1} / {totalPages}</span>
        <button
          type="button"
          aria-label="Próxima página"
          disabled={current >= totalPages - 1}
          onClick={() => onPageChange(current + 1)}
          className="flex size-8 items-center justify-center rounded-full border border-input text-primary transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
