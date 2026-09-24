import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { TipBox } from "@/components/common/TipBox";
import { CnpjAtivoBadge, ConferenciaStatusBadge } from "@/components/status/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompetencia, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { cnpjService } from "@/services/cnpjService";
import { useDatabase } from "@/services/database";

export default function Cnpjs() {
  useDatabase();
  const navigate = useNavigate();
  const cnpjs = cnpjService.listComContagem();
  const conferencias = cnpjService.listConferencias();
  const pendente = conferencias.find((c) => c.status !== "confirmada");

  return (
    <div>
      <PageHeader
        title="CNPJs"
        subtitle="Confira mensalmente a qual CNPJ cada colaborador pertence para que as cobranças sejam emitidas corretamente."
      />

      {pendente && (
        <TipBox className="mb-8">
          A conferência de <strong>{formatCompetencia(pendente.competencia)}</strong> ainda não foi confirmada. O prazo é{" "}
          <strong>{formatDate(pendente.prazo)}</strong>.
        </TipBox>
      )}

      <section className="mb-10">
        <h2 className="mb-1 text-xl font-bold text-foreground">CNPJs da empresa</h2>
        <p className="mb-4 text-sm text-muted-foreground">Os CNPJs são cadastrados pela Guapeco. Aqui você só consulta.</p>
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Razão social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead className="text-right">Colaboradores</TableHead>
                <TableHead className="text-right">Com adesão</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cnpjs.map((c) => (
                <TableRow key={c.id} className="hover:bg-transparent">
                  <TableCell className="font-semibold text-foreground">{c.razaoSocial}</TableCell>
                  <TableCell className="text-muted-foreground">{c.cnpj}</TableCell>
                  <TableCell className="text-right text-foreground">{formatNumber(c.colaboradores)}</TableCell>
                  <TableCell className="text-right text-foreground">{formatNumber(c.comAdesao)}</TableCell>
                  <TableCell><CnpjAtivoBadge ativo={c.ativo} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-xl font-bold text-foreground">Conferência mensal</h2>
        <p className="mb-4 text-sm text-muted-foreground">Uma conferência por mês. Depois de confirmada, ela fica disponível apenas para consulta.</p>
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Competência</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confirmado por</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {conferencias.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/cnpjs/conferencia/${c.id}`)}>
                  <TableCell className="font-semibold text-foreground first-letter:uppercase">{formatCompetencia(c.competencia)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.prazo)}</TableCell>
                  <TableCell><ConferenciaStatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{c.confirmadoPor ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.confirmadoEm ? formatDateTime(c.confirmadoEm) : "—"}</TableCell>
                  <TableCell><ChevronRight className="size-4 text-primary" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
