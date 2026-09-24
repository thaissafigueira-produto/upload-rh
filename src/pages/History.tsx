import { ChevronRight, History as HistoryIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { UploadStatusBadge } from "@/components/status/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { useDatabase } from "@/services/database";
import { uploadsService } from "@/services/uploadsService";
import { versionsService } from "@/services/versionsService";

export default function History() {
  useDatabase();
  const navigate = useNavigate();
  const uploads = uploadsService.list();
  const versions = versionsService.list();

  return (
    <div>
      <PageHeader title="Histórico" subtitle="Consulte todas as atualizações realizadas na base da sua empresa." />

      {uploads.length === 0 ? (
        <EmptyState icon={HistoryIcon} title="Nenhuma atualização registrada ainda" description="Quando você enviar a primeira base, ela aparecerá aqui." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Data e hora</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Novos</TableHead>
                <TableHead className="text-right">Não encontrados</TableHead>
                <TableHead className="text-right">Alterados</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploads.map((u) => (
                <TableRow key={u.id} className="cursor-pointer" onClick={() => navigate(`/historico/${u.id}`)}>
                  <TableCell className="font-semibold text-foreground">{formatDateTime(u.data)}</TableCell>
                  <TableCell className="text-muted-foreground">{u.usuario}</TableCell>
                  <TableCell className="text-muted-foreground">{u.arquivo}</TableCell>
                  <TableCell className="text-right text-foreground">{formatNumber(u.total)}</TableCell>
                  <TableCell className="text-right text-success">{u.status === "confirmada" ? `+${u.novos}` : "—"}</TableCell>
                  <TableCell className="text-right text-warning">{u.status === "confirmada" ? u.naoEncontrados : "—"}</TableCell>
                  <TableCell className="text-right text-foreground">{u.status === "confirmada" ? u.alterados : "—"}</TableCell>
                  <TableCell><UploadStatusBadge status={u.status} /></TableCell>
                  <TableCell><ChevronRight className="size-4 text-primary" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {versions.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-foreground">Versões da base</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Cada atualização confirmada gera uma versão. Versões antigas ficam disponíveis para consulta e não podem ser alteradas.
          </p>
          <ul className="overflow-hidden rounded-2xl border border-border">
            {versions.map((v, idx) => (
              <li key={v.id} className="border-b border-border/70 last:border-0">
                <Link
                  to={`/historico/${v.uploadId}?aba=base`}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/70"
                >
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-base font-bold text-foreground">Versão {formatDate(v.data)}</span>
                    <span className="text-sm text-muted-foreground">{formatNumber(v.total)} colaboradores</span>
                    {idx === 0 && <span className="rounded-full bg-lilac-soft px-2.5 py-0.5 text-xs font-bold text-primary">Atual</span>}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
