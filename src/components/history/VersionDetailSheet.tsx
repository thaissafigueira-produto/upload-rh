import { ChangedEmployeesTable, NewEmployeesTable, RemovedEmployeesTable } from "@/components/upload/ChangeTables";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";
import type { BaseVersion } from "@/types";

export function VersionDetailSheet({
  version,
  onOpenChange,
}: {
  version: BaseVersion | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!version) return null;
  const diff = version.diff ?? { novos: [], removidos: [], alterados: [] };
  const erros = version.validation?.errosDetalhados ?? [];

  return (
    <Sheet open={Boolean(version)} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Versão {version.numero} — {formatDateTime(version.data)}</SheetTitle>
          <SheetDescription>
            {version.arquivo} · enviado por {version.usuario}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">{version.total} colaboradores processados</Badge>
            <Badge className="border-transparent bg-success-soft font-normal text-success">+{version.novos} novos</Badge>
            <Badge variant="outline" className="font-normal text-muted-foreground">−{version.removidos} removidos</Badge>
            <Badge variant="outline" className="font-normal">{version.alterados} alterados</Badge>
          </div>

          <Tabs defaultValue="novos">
            <TabsList>
              <TabsTrigger value="novos">Novos ({diff.novos.length})</TabsTrigger>
              <TabsTrigger value="removidos">Removidos ({diff.removidos.length})</TabsTrigger>
              <TabsTrigger value="alterados">Alterados ({diff.alterados.length})</TabsTrigger>
              <TabsTrigger value="erros">Erros ({erros.length})</TabsTrigger>
            </TabsList>
            <div className="mt-4 rounded-lg border border-border p-4">
              <TabsContent value="novos"><NewEmployeesTable employees={diff.novos} /></TabsContent>
              <TabsContent value="removidos"><RemovedEmployeesTable employees={diff.removidos} /></TabsContent>
              <TabsContent value="alterados"><ChangedEmployeesTable changes={diff.alterados} /></TabsContent>
              <TabsContent value="erros">
                {erros.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nenhum erro registrado nesta atualização.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Linha</TableHead>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Campo</TableHead>
                        <TableHead>Problema</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {erros.map((e, idx) => (
                        <TableRow key={`${e.linha}-${idx}`}>
                          <TableCell className="text-muted-foreground">{e.linha}</TableCell>
                          <TableCell className="font-medium text-foreground">{e.colaborador}</TableCell>
                          <TableCell className="text-muted-foreground">{e.campo}</TableCell>
                          <TableCell className="text-destructive">{e.problema}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
