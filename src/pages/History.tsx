import { History as HistoryIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { VersionDetailSheet } from "@/components/history/VersionDetailSheet";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { BaseVersion } from "@/types";

export default function History() {
  const { versions } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<BaseVersion | null>(null);

  const ordered = useMemo(() => [...versions].sort((a, b) => b.numero - a.numero), [versions]);

  const preselectedId = searchParams.get("v");
  const preselected = preselectedId ? versions.find((v) => v.id === preselectedId) ?? null : null;
  const active = selected ?? preselected;

  function close() {
    setSelected(null);
    if (searchParams.get("v")) {
      searchParams.delete("v");
      setSearchParams(searchParams, { replace: true });
    }
  }

  return (
    <div>
      <PageHeader
        title="Histórico"
        subtitle="Consulte todas as atualizações realizadas na base da sua empresa."
      />

      {ordered.length === 0 ? (
        <EmptyState icon={HistoryIcon} title="Nenhuma atualização registrada ainda" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Novos</TableHead>
                <TableHead>Removidos</TableHead>
                <TableHead>Alterados</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordered.map((version) => (
                <TableRow key={version.id} className="cursor-pointer" onClick={() => setSelected(version)}>
                  <TableCell className="text-foreground">{formatDateTime(version.data)}</TableCell>
                  <TableCell className="text-muted-foreground">{version.usuario}</TableCell>
                  <TableCell className="text-muted-foreground">{version.arquivo}</TableCell>
                  <TableCell className="text-muted-foreground">{version.total}</TableCell>
                  <TableCell className="text-success">+{version.novos}</TableCell>
                  <TableCell className="text-muted-foreground">−{version.removidos}</TableCell>
                  <TableCell className="text-muted-foreground">{version.alterados}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal capitalize">{version.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <VersionDetailSheet version={active} onOpenChange={(open) => !open && close()} />
    </div>
  );
}
