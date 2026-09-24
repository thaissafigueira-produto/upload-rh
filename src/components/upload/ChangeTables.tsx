import { AlertTriangle, FileX2, UserPlus, UserX } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { BenefitStatusBadge } from "@/components/status/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { shortRazaoSocial } from "@/lib/cnpj";
import { cn } from "@/lib/utils";
import type { Cnpj, Employee, EmployeeDiffChanged } from "@/types";

function cnpjLabel(cnpj: string, cnpjs: Cnpj[]) {
  if (!cnpj) return <span className="text-muted-foreground">Sem CNPJ</span>;
  const razao = cnpjs.find((c) => c.cnpj === cnpj)?.razaoSocial;
  return (
    <span>
      {razao && <span className="block text-foreground">{shortRazaoSocial(razao)}</span>}
      <span className="text-xs text-muted-foreground">{cnpj}</span>
    </span>
  );
}

export function NewEmployeesTable({ employees, cnpjs }: { employees: Employee[]; cnpjs: Cnpj[] }) {
  if (employees.length === 0) {
    return <EmptyState icon={UserPlus} title="Nenhum colaborador novo" description="Todos os colaboradores da nova base já estavam na base anterior." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Nome</TableHead>
          <TableHead>E-mail corporativo</TableHead>
          <TableHead>Matrícula</TableHead>
          <TableHead>Departamento</TableHead>
          <TableHead>CNPJ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="font-semibold text-foreground">{e.nome}</TableCell>
            <TableCell className="text-muted-foreground">{e.email}</TableCell>
            <TableCell className="text-muted-foreground">{e.matricula}</TableCell>
            <TableCell className="text-muted-foreground">{e.departamento || "—"}</TableCell>
            <TableCell>{cnpjLabel(e.cnpj, cnpjs)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function NaoEncontradosTable({ employees, cnpjs }: { employees: Employee[]; cnpjs: Cnpj[] }) {
  if (employees.length === 0) {
    return <EmptyState icon={UserX} title="Nenhum colaborador deixou de aparecer" description="Todos os colaboradores da base anterior estão na nova base." />;
  }
  const sorted = [...employees].sort((a, b) => Number(b.beneficio === "com_adesao") - Number(a.beneficio === "com_adesao"));
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Nome</TableHead>
          <TableHead>Matrícula</TableHead>
          <TableHead>Departamento</TableHead>
          <TableHead>CNPJ</TableHead>
          <TableHead>Benefício</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((e) => (
          <TableRow key={e.id} className={cn(e.beneficio === "com_adesao" && "bg-lilac-soft/60")}>
            <TableCell className="font-semibold text-foreground">{e.nome}</TableCell>
            <TableCell className="text-muted-foreground">{e.matricula}</TableCell>
            <TableCell className="text-muted-foreground">{e.departamento || "—"}</TableCell>
            <TableCell>{cnpjLabel(e.cnpj, cnpjs)}</TableCell>
            <TableCell><BenefitStatusBadge status={e.beneficio} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ChangedEmployeesTable({ changes }: { changes: EmployeeDiffChanged[] }) {
  if (changes.length === 0) {
    return <EmptyState icon={FileX2} title="Nenhuma alteração de cadastro" description="Os dados dos colaboradores que continuam na base não mudaram." />;
  }
  return (
    <div className="flex flex-col gap-4">
      {changes.map((change) => (
        <div key={change.id} className="rounded-2xl border border-border p-4">
          <p className="text-base font-bold text-foreground">{change.nome}</p>
          <p className="text-xs text-muted-foreground">Matrícula {change.matricula}</p>
          <Table className="mt-2">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-44">Campo</TableHead>
                <TableHead>Valor anterior</TableHead>
                <TableHead>Novo valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {change.mudancas.map((m) => (
                <TableRow key={m.campo} className={cn(m.destaque && "bg-warning-soft/70 hover:bg-warning-soft")}>
                  <TableCell className="font-medium text-foreground">
                    {m.campo}
                    {m.destaque && (
                      <span className="mt-0.5 flex items-center gap-1 text-[0.7rem] font-semibold text-warning">
                        <AlertTriangle className="size-3" />
                        Afeta o faturamento
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground line-through decoration-border">{m.anterior || "—"}</TableCell>
                  <TableCell className="font-semibold text-foreground">{m.novo || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
