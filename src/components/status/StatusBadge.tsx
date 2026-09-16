import { cn } from "@/lib/utils";
import type { BenefitStatus, EmployeeStatus } from "@/types";

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const isAtivo = status === "ativo";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        isAtivo ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
      )}
    >
      <span className={cn("size-1.5 rounded-full", isAtivo ? "bg-success" : "bg-muted-foreground")} />
      {isAtivo ? "Ativo" : "Desligado"}
    </span>
  );
}

export function BenefitStatusBadge({ status }: { status: BenefitStatus }) {
  const hasAdesao = status === "com_adesao";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        hasAdesao ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground",
      )}
    >
      {hasAdesao ? "Com adesão" : "Sem adesão"}
    </span>
  );
}

export function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
      <span className="size-1.5 rounded-full bg-warning" />
      Não encontrado na nova base
    </span>
  );
}
