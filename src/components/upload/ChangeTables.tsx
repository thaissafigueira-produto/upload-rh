import { EmptyState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileX2, UserPlus, UserX } from "lucide-react";
import type { Employee, EmployeeDiffChanged } from "@/types";

export function NewEmployeesTable({ employees }: { employees: Employee[] }) {
  if (employees.length === 0) {
    return <EmptyState icon={UserPlus} title="Nenhum colaborador novo nesta atualização" />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
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
            <TableCell className="font-medium text-foreground">{e.nome}</TableCell>
            <TableCell className="text-muted-foreground">{e.email}</TableCell>
            <TableCell className="text-muted-foreground">{e.matricula}</TableCell>
            <TableCell className="text-muted-foreground">{e.departamento}</TableCell>
            <TableCell className="text-muted-foreground">{e.cnpj}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function RemovedEmployeesTable({ employees }: { employees: Employee[] }) {
  if (employees.length === 0) {
    return <EmptyState icon={UserX} title="Nenhum colaborador removido nesta atualização" />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
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
            <TableCell className="font-medium text-foreground">{e.nome}</TableCell>
            <TableCell className="text-muted-foreground">{e.email}</TableCell>
            <TableCell className="text-muted-foreground">{e.matricula}</TableCell>
            <TableCell className="text-muted-foreground">{e.departamento}</TableCell>
            <TableCell className="text-muted-foreground">{e.cnpj}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ChangedEmployeesTable({ changes }: { changes: EmployeeDiffChanged[] }) {
  if (changes.length === 0) {
    return <EmptyState icon={FileX2} title="Nenhuma alteração de cadastro nesta atualização" />;
  }
  return (
    <div className="divide-y divide-border">
      {changes.map((change) => (
        <div key={change.id} className="py-4 first:pt-0">
          <p className="text-sm font-medium text-foreground">{change.nome}</p>
          <p className="text-xs text-muted-foreground">Matrícula {change.matricula}</p>
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Campo</TableHead>
                <TableHead>Valor anterior</TableHead>
                <TableHead>Novo valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {change.mudancas.map((m) => (
                <TableRow key={m.campo}>
                  <TableCell className="text-muted-foreground">{m.campo}</TableCell>
                  <TableCell className="text-muted-foreground line-through decoration-border">{m.anterior || "—"}</TableCell>
                  <TableCell className="font-medium text-foreground">{m.novo || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
