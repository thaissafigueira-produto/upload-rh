import {
  AlertCircle, AlertTriangle, CheckCircle2, CircleDashed, Clock, Heart, UserX, XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BenefitStatus, ConferenciaStatus, EmployeeStatus, UploadStatus } from "@/types";

function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap [&>svg]:size-3.5", className)}>
      {children}
    </span>
  );
}

export function EmployeeStatusBadge({ status, compact }: { status: EmployeeStatus; compact?: boolean }) {
  if (status === "ativo") {
    return <Pill className="bg-success-soft text-success"><CheckCircle2 />Ativo</Pill>;
  }
  if (status === "nao_encontrado") {
    return (
      <Pill className="bg-warning-soft text-warning" >
        <AlertTriangle />
        {compact ? "Não encontrado" : "Não encontrado na última base"}
      </Pill>
    );
  }
  return <Pill className="bg-muted text-muted-foreground"><UserX />Desligado</Pill>;
}

export function BenefitStatusBadge({ status }: { status: BenefitStatus }) {
  return status === "com_adesao" ? (
    <Pill className="bg-lilac-soft text-primary"><Heart />Com adesão</Pill>
  ) : (
    <Pill className="bg-muted text-muted-foreground">Sem adesão</Pill>
  );
}

export function UploadStatusBadge({ status }: { status: UploadStatus }) {
  if (status === "confirmada") return <Pill className="bg-success-soft text-success"><CheckCircle2 />Confirmada</Pill>;
  if (status === "com_erros") return <Pill className="bg-rose-soft text-destructive"><AlertCircle />Com erros</Pill>;
  if (status === "cancelada") return <Pill className="bg-muted text-muted-foreground"><XCircle />Cancelada</Pill>;
  return <Pill className="bg-lilac-soft text-primary"><CircleDashed />Em análise</Pill>;
}

export function ConferenciaStatusBadge({ status }: { status: ConferenciaStatus }) {
  if (status === "confirmada") return <Pill className="bg-success-soft text-success"><CheckCircle2 />Confirmada</Pill>;
  if (status === "em_conferencia") return <Pill className="bg-lilac-soft text-primary"><CircleDashed />Em conferência</Pill>;
  return <Pill className="bg-warning-soft text-warning"><Clock />Pendente</Pill>;
}

export function CnpjAtivoBadge({ ativo }: { ativo: boolean }) {
  return ativo ? (
    <Pill className="bg-success-soft text-success"><CheckCircle2 />Ativo</Pill>
  ) : (
    <Pill className="bg-muted text-muted-foreground"><XCircle />Inativo</Pill>
  );
}

export function Star4({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-3", className)} fill="currentColor" aria-hidden>
      <path d="M12 1.5c.6 6.2 4.3 9.9 10.5 10.5-6.2.6-9.9 4.3-10.5 10.5C11.4 16.3 7.7 12.6 1.5 12 7.7 11.4 11.4 7.7 12 1.5Z" />
    </svg>
  );
}

export function NewBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-soft px-2 py-0.5 text-[0.7rem] font-bold text-[#a4545a]">
      <Star4 className="size-2.5 text-rose" />
      Novo
    </span>
  );
}

export function PendingBadge() {
  return <EmployeeStatusBadge status="nao_encontrado" />;
}
