import { PawPrint } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ValidationErrorRow } from "@/types";

export function ErrorsTable({ errors }: { errors: ValidationErrorRow[] }) {
  if (errors.length === 0) {
    return <EmptyState icon={PawPrint} title="Nenhum erro encontrado" description="Todos os registros passaram na validação." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-20">Linha</TableHead>
          <TableHead>Colaborador</TableHead>
          <TableHead>Campo</TableHead>
          <TableHead>Problema</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {errors.map((e, idx) => (
          <TableRow key={`${e.linha}-${e.campo}-${idx}`}>
            <TableCell className="text-muted-foreground">{e.linha}</TableCell>
            <TableCell className="font-semibold text-foreground">{e.colaborador}</TableCell>
            <TableCell className="text-muted-foreground">{e.campo}</TableCell>
            <TableCell className="text-destructive">{e.problema}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
