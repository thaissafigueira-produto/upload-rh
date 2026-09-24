import { useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { BenefitStatusBadge, EmployeeStatusBadge, UploadStatusBadge } from "@/components/status/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangedEmployeesTable, NaoEncontradosTable, NewEmployeesTable } from "@/components/upload/ChangeTables";
import { ErrorsTable } from "@/components/upload/ErrorsTable";
import { shortRazaoSocial } from "@/lib/cnpj";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { auditService } from "@/services/auditService";
import { cnpjService } from "@/services/cnpjService";
import { useDatabase } from "@/services/database";
import { uploadsService } from "@/services/uploadsService";
import { versionsService } from "@/services/versionsService";

const PAGE_SIZE = 25;

export default function HistoryDetail() {
  useDatabase();
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [basePage, setBasePage] = useState(0);
  const upload = uploadsService.get(id);
  if (!upload) return <Navigate to="/historico" replace />;

  const cnpjs = cnpjService.list();
  const version = upload.versaoId ? versionsService.get(upload.versaoId) : undefined;
  const events = auditService.forUpload(upload.id);
  const { diff, validation } = upload;
  const defaultTab = searchParams.get("aba") === "base" && version ? "base" : "novos";
  const base = (version?.colaboradores ?? []).filter((e) => e.status !== "desligado");
  const basePageItems = base.slice(basePage * PAGE_SIZE, basePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "Histórico", to: "/historico" }, { label: `Atualização de ${formatDate(upload.data)}` }]}
        title={`Atualização de ${formatDate(upload.data)}`}
        subtitle={`${upload.arquivo} · enviado por ${upload.usuario} em ${formatDateTime(upload.data)}`}
        action={<UploadStatusBadge status={upload.status} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Colaboradores processados" value={formatNumber(upload.total)} />
        <Stat label="Novos" value={`+${upload.novos}`} className="text-success" />
        <Stat label="Não encontrados" value={String(upload.naoEncontrados)} className="text-warning" />
        <Stat label="Alterados" value={String(upload.alterados)} />
      </div>
      {version && (
        <p className="mb-6 text-sm text-muted-foreground">
          Gerou a <strong className="text-foreground">versão {formatDate(version.data)}</strong> da base, com {formatNumber(version.total)} colaboradores. Esta versão não pode ser alterada.
        </p>
      )}

      <Tabs defaultValue={defaultTab}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="novos" className="py-2">Novos ({diff.novos.length})</TabsTrigger>
          <TabsTrigger value="nao_encontrados" className="py-2">Não encontrados ({diff.naoEncontrados.length})</TabsTrigger>
          <TabsTrigger value="alterados" className="py-2">Alterados ({diff.alterados.length})</TabsTrigger>
          <TabsTrigger value="erros" className="py-2">Erros ({validation.errosDetalhados.length})</TabsTrigger>
          {version && <TabsTrigger value="base" className="py-2">Base desta versão ({formatNumber(base.length)})</TabsTrigger>}
        </TabsList>
        <div className="mt-4 rounded-2xl border border-border p-4">
          <TabsContent value="novos"><NewEmployeesTable employees={diff.novos} cnpjs={cnpjs} /></TabsContent>
          <TabsContent value="nao_encontrados"><NaoEncontradosTable employees={diff.naoEncontrados} cnpjs={cnpjs} /></TabsContent>
          <TabsContent value="alterados"><ChangedEmployeesTable changes={diff.alterados} /></TabsContent>
          <TabsContent value="erros"><ErrorsTable errors={validation.errosDetalhados} /></TabsContent>
          {version && (
            <TabsContent value="base">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Nome</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Benefício</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {basePageItems.map((e) => (
                    <TableRow key={e.id} className="hover:bg-transparent">
                      <TableCell className="font-semibold text-foreground">{e.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{e.matricula}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.cnpj ? shortRazaoSocial(cnpjs.find((c) => c.cnpj === e.cnpj)?.razaoSocial ?? e.cnpj) : "Sem CNPJ"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{e.departamento || "—"}</TableCell>
                      <TableCell><EmployeeStatusBadge status={e.status} /></TableCell>
                      <TableCell><BenefitStatusBadge status={e.beneficio} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination page={basePage} pageSize={PAGE_SIZE} total={base.length} onPageChange={setBasePage} />
            </TabsContent>
          )}
        </div>
      </Tabs>

      {events.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold text-foreground">Registro desta atualização</h2>
          <ol className="flex flex-col gap-3 border-l-2 border-lilac-soft pl-5">
            {events.map((ev) => (
              <li key={ev.id} className="relative">
                <span className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full bg-lilac" />
                <p className="text-sm font-semibold text-foreground">{ev.descricao}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(ev.data)} · {ev.usuario}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <Card>
      <CardContent className="px-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={`mt-1 text-3xl font-bold tracking-tight ${className ?? "text-foreground"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
