import { AlertTriangle, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/common/EmptyState";
import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { ConferenciaStatusBadge } from "@/components/status/StatusBadge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompetencia, formatDate, formatNumber } from "@/lib/format";
import { useDatabase } from "@/services/database";
import { guapecoService } from "@/services/guapecoService";

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function GuapecoEmpresas() {
  useDatabase();
  guapecoService.clearFocus();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const empresas = guapecoService.listEmpresas();
  const filtered = empresas.filter((e) => normalize(e.empresa.nome).includes(normalize(query.trim())));

  const desatualizadas = empresas.filter((e) => e.desatualizada).length;
  const conferenciasAbertas = empresas.filter((e) => e.conferencia).length;
  const atrasadas = empresas.filter((e) => e.conferencia?.atrasada).length;

  return (
    <div>
      <PageHeader
        title="Empresas"
        subtitle="Acompanhe a base de colaboradores e a conferência de CNPJs de cada empresa cliente."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Empresas clientes" value={formatNumber(empresas.length)} />
        <MetricCard
          label="Bases desatualizadas"
          value={formatNumber(desatualizadas)}
          context="Sem atualização há mais de 30 dias"
        />
        <MetricCard
          label="Conferências em aberto"
          value={formatNumber(conferenciasAbertas)}
          context={atrasadas > 0 ? `${atrasadas} fora do prazo` : "Todas dentro do prazo"}
        />
      </div>

      <div className="mt-8 relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar empresa" className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border">
        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Nenhuma empresa encontrada" description="Tente outro nome de empresa." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Colaboradores</TableHead>
                <TableHead className="text-right">Com adesão</TableHead>
                <TableHead>Última atualização da base</TableHead>
                <TableHead className="text-right">Não encontrados</TableHead>
                <TableHead>Conferência de CNPJs</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.empresa.id} className="cursor-pointer" onClick={() => navigate(`/guapeco/empresas/${r.empresa.id}`)}>
                  <TableCell className="font-semibold text-foreground">{r.empresa.nome}</TableCell>
                  <TableCell className="text-right text-foreground">{formatNumber(r.naBase)}</TableCell>
                  <TableCell className="text-right text-foreground">{formatNumber(r.comAdesao)}</TableCell>
                  <TableCell>
                    {r.ultimaAtualizacao ? (
                      <span>
                        <span className="text-foreground">{formatDate(r.ultimaAtualizacao)}</span>
                        <span className="ml-2 text-xs text-muted-foreground">há {r.diasSemAtualizar} dias</span>
                        {r.desatualizada && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
                            <AlertTriangle className="size-3" />
                            Desatualizada
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Nenhuma atualização</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-foreground">{r.naoEncontrados}</TableCell>
                  <TableCell>
                    {r.conferencia ? (
                      <span className="flex items-center gap-2">
                        <span className="text-sm text-foreground first-letter:uppercase">{formatCompetencia(r.conferencia.competencia)}</span>
                        {r.conferencia.atrasada ? (
                          <span className="rounded-full bg-rose-soft px-2.5 py-1 text-xs font-semibold text-destructive">Fora do prazo</span>
                        ) : (
                          <ConferenciaStatusBadge status={r.conferencia.status} />
                        )}
                      </span>
                    ) : (
                      <span className="text-sm text-success">Em dia</span>
                    )}
                  </TableCell>
                  <TableCell><ChevronRight className="size-4 text-primary" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
