import { AlertTriangle, ArrowRightLeft, Building2, Download, Filter, PawPrint, Search, UserX } from "lucide-react";
import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { TipBox } from "@/components/common/TipBox";
import { ConferenciaStatusBadge } from "@/components/status/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { shortRazaoSocial } from "@/lib/cnpj";
import { downloadTextFile } from "@/lib/csv";
import { formatCompetencia, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { cnpjService, type AlertaConferencia } from "@/services/cnpjService";
import { useDatabase } from "@/services/database";
import { employeesService } from "@/services/employeesService";

const PAGE_SIZE = 25;

const ALERTA_LABEL: Record<AlertaConferencia, string> = {
  sem_cnpj: "Sem CNPJ",
  cnpj_alterado: "CNPJ alterado",
  nao_encontrado: "Não encontrado na base",
};

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function ConferenciaDetail() {
  useDatabase();
  const { id = "" } = useParams();
  const view = cnpjService.getView(id);
  const cnpjs = cnpjService.list();
  const cnpjsAtivos = cnpjService.listAtivos();

  const [query, setQuery] = useState("");
  const [cnpjFilter, setCnpjFilter] = useState("todos");
  const [alertFilter, setAlertFilter] = useState<AlertaConferencia | "todos">("todos");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCnpj, setBulkCnpj] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const q = normalize(query.trim());
  const filtered = (view?.linhas ?? []).filter((l) => {
    if (alertFilter !== "todos" && !l.alertas.includes(alertFilter)) return false;
    if (cnpjFilter === "sem_cnpj" ? l.cnpj !== "" : cnpjFilter !== "todos" && l.cnpj !== cnpjFilter) return false;
    return !q || normalize(l.nome).includes(q) || normalize(l.matricula).includes(q);
  });

  if (!view) return <Navigate to="/cnpjs" replace />;

  const { conferencia, somenteLeitura, totais, porCnpj } = view;
  const competencia = formatCompetencia(conferencia.competencia);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1));
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const allOnPageSelected = pageItems.length > 0 && pageItems.every((l) => selected.has(l.employeeId));
  const bloqueada = totais.semCnpj > 0;

  function toggleAlert(alerta: AlertaConferencia) {
    setAlertFilter((current) => (current === alerta ? "todos" : alerta));
    setPage(0);
  }

  function toggleRow(employeeId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(employeeId);
      else next.delete(employeeId);
      return next;
    });
  }

  function confirmarConferencia() {
    const result = cnpjService.confirmar(conferencia.id);
    setConfirmOpen(false);
    if (result.ok) toast.success("Conferência confirmada.");
    else toast.error(result.motivo);
  }

  function downloadResumo() {
    const csv = cnpjService.exportResumoCsv(conferencia.id);
    if (csv) downloadTextFile(csv.filename, csv.content);
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "CNPJs", to: "/cnpjs" }, { label: `Conferência de ${competencia}` }]}
        title={`Conferência de ${competencia}`}
        subtitle={`Prazo: ${formatDate(conferencia.prazo)}`}
        action={<ConferenciaStatusBadge status={conferencia.status} />}
      />

      {somenteLeitura ? (
        <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-success-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <PawPrint className="mt-0.5 size-6 shrink-0 text-success" />
            <div>
              <p className="text-base font-bold text-success">Conferência confirmada</p>
              <p className="text-sm text-foreground">
                Confirmada por {conferencia.confirmadoPor} em {conferencia.confirmadoEm ? formatDateTime(conferencia.confirmadoEm) : "—"}.
                O financeiro da Guapeco já pode emitir as cobranças deste mês. Esta conferência é somente para consulta.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={downloadResumo} className="shrink-0"><Download />Baixar resumo (CSV)</Button>
        </div>
      ) : (
        <TipBox className="mb-8">
          Confira se cada colaborador com adesão está no CNPJ correto. Após confirmar, o financeiro da Guapeco usará essa informação para emitir as notas fiscais e boletos do mês.
        </TipBox>
      )}

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-foreground">Colaboradores com adesão por CNPJ</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {porCnpj.filter((c) => c.quantidade > 0 || cnpjs.find((x) => x.cnpj === c.cnpj)?.ativo).map((c) => (
            <Card key={c.cnpj}>
              <CardContent className="px-5">
                <p className="text-sm font-semibold text-foreground">{shortRazaoSocial(c.razaoSocial)}</p>
                <p className="text-xs text-muted-foreground">{c.cnpj}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{formatNumber(c.quantidade)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {!somenteLeitura && (
        <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <AlertCard
            active={alertFilter === "sem_cnpj"} tone="destructive" icon={<AlertTriangle className="size-5" />}
            title="Sem CNPJ" count={totais.semCnpj} text="colaboradores com adesão sem CNPJ definido" onClick={() => toggleAlert("sem_cnpj")}
          />
          <AlertCard
            active={alertFilter === "cnpj_alterado"} tone="warning" icon={<ArrowRightLeft className="size-5" />}
            title="CNPJ alterado" count={totais.cnpjAlterado} text="mudaram de CNPJ desde a última conferência" onClick={() => toggleAlert("cnpj_alterado")}
          />
          <AlertCard
            active={alertFilter === "nao_encontrado"} tone="warning" icon={<UserX className="size-5" />}
            title="Não encontrados na base" count={totais.naoEncontrado} text="com adesão, fora da última base" onClick={() => toggleAlert("nao_encontrado")}
          />
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou matrícula" className="pl-10" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={cnpjFilter} onValueChange={(v) => { setCnpjFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-60"><SelectValue placeholder="CNPJ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os CNPJs</SelectItem>
              <SelectItem value="sem_cnpj">Sem CNPJ definido</SelectItem>
              {cnpjs.map((c) => <SelectItem key={c.id} value={c.cnpj}>{shortRazaoSocial(c.razaoSocial)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {!somenteLeitura && (
          <Select value={alertFilter} onValueChange={(v) => { setAlertFilter(v as AlertaConferencia | "todos"); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Alerta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os alertas</SelectItem>
              {(Object.keys(ALERTA_LABEL) as AlertaConferencia[]).map((a) => <SelectItem key={a} value={a}>{ALERTA_LABEL[a]}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {!somenteLeitura && selected.size > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-lilac-soft px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{selected.size} {selected.size === 1 ? "colaborador selecionado" : "colaboradores selecionados"}</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Limpar seleção</Button>
            <Button size="sm" onClick={() => { setBulkCnpj(""); setBulkOpen(true); }}><Building2 />Alterar CNPJ</Button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-border">
        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Nenhum colaborador encontrado" description="Ajuste a busca ou os filtros para ver os colaboradores desta conferência." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {!somenteLeitura && (
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Selecionar todos desta página"
                      checked={allOnPageSelected}
                      onCheckedChange={(checked) => setSelected((prev) => {
                        const next = new Set(prev);
                        pageItems.forEach((l) => (checked ? next.add(l.employeeId) : next.delete(l.employeeId)));
                        return next;
                      })}
                    />
                  </TableHead>
                )}
                <TableHead>Nome</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>CNPJ atual</TableHead>
                <TableHead>Alerta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((l) => (
                <TableRow key={l.employeeId} data-state={selected.has(l.employeeId) ? "selected" : undefined}>
                  {!somenteLeitura && (
                    <TableCell>
                      <Checkbox
                        aria-label={`Selecionar ${l.nome}`}
                        checked={selected.has(l.employeeId)}
                        onCheckedChange={(checked) => toggleRow(l.employeeId, checked === true)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-semibold text-foreground">{l.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{l.matricula}</TableCell>
                  <TableCell className="text-muted-foreground">{l.departamento || "—"}</TableCell>
                  <TableCell>
                    {somenteLeitura ? (
                      <span className="text-foreground">{shortRazaoSocial(cnpjs.find((c) => c.cnpj === l.cnpj)?.razaoSocial ?? l.cnpj)} <span className="text-xs text-muted-foreground">{l.cnpj}</span></span>
                    ) : (
                      <Select
                        value={l.cnpj || undefined}
                        onValueChange={(value) => {
                          employeesService.updateCnpj(l.employeeId, value);
                          toast.success(`CNPJ de ${l.nome} atualizado.`);
                        }}
                      >
                        <SelectTrigger className={cn("h-9 w-72", !l.cnpj && "border-destructive/50 text-destructive")}>
                          <SelectValue placeholder="Definir CNPJ" />
                        </SelectTrigger>
                        <SelectContent>
                          {cnpjsAtivos.map((c) => <SelectItem key={c.id} value={c.cnpj}>{shortRazaoSocial(c.razaoSocial)} — {c.cnpj}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    {l.cnpjAnterior && <p className="mt-0.5 text-xs text-muted-foreground">Antes: {l.cnpjAnterior}</p>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {l.alertas.map((a) => (
                        <span
                          key={a}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
                            a === "sem_cnpj" ? "bg-rose-soft text-destructive" : "bg-warning-soft text-warning",
                          )}
                        >
                          {ALERTA_LABEL[a]}
                        </span>
                      ))}
                      {l.alertas.length === 0 && <span className="text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />

      {!somenteLeitura && (
        <div className="mt-8 rounded-2xl border border-border p-5">
          {bloqueada && (
            <p className="mb-3 flex items-start gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              Não é possível confirmar ainda: {totais.semCnpj} {totais.semCnpj === 1 ? "colaborador com adesão está" : "colaboradores com adesão estão"} sem CNPJ definido. Defina o CNPJ de cada um para liberar a confirmação.
            </p>
          )}
          <Button size="lg" disabled={bloqueada} onClick={() => setConfirmOpen(true)}>
            Confirmar conferência de {competencia}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Confirmar conferência de ${competencia}?`}
        description="Após confirmar, os vínculos de CNPJ deste mês não poderão ser alterados. Alterações futuras valerão para o próximo mês."
        confirmLabel="Confirmar conferência"
        onConfirm={confirmarConferencia}
      />

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar CNPJ em massa</DialogTitle>
            <DialogDescription>
              O CNPJ de {selected.size} {selected.size === 1 ? "colaborador será alterado" : "colaboradores será alterado"}. Escolha o novo CNPJ.
            </DialogDescription>
          </DialogHeader>
          <Select value={bulkCnpj} onValueChange={setBulkCnpj}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o CNPJ" /></SelectTrigger>
            <SelectContent>
              {cnpjsAtivos.map((c) => <SelectItem key={c.id} value={c.cnpj}>{shortRazaoSocial(c.razaoSocial)} — {c.cnpj}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancelar</Button>
            <Button
              disabled={!bulkCnpj}
              onClick={() => {
                employeesService.bulkUpdateCnpj([...selected], bulkCnpj);
                toast.success(`CNPJ de ${selected.size} ${selected.size === 1 ? "colaborador atualizado" : "colaboradores atualizados"}.`);
                setSelected(new Set());
                setBulkOpen(false);
              }}
            >
              Alterar CNPJ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertCard({
  active, tone, icon, title, count, text, onClick,
}: {
  active: boolean;
  tone: "destructive" | "warning";
  icon: React.ReactNode;
  title: string;
  count: number;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
        active ? "border-primary bg-lilac-soft" : "border-border bg-card hover:bg-muted",
      )}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", tone === "destructive" ? "bg-rose-soft text-destructive" : "bg-warning-soft text-warning")}>
        {icon}
      </span>
      <span>
        <span className="block text-sm font-bold text-foreground">{title}</span>
        <span className="block text-2xl font-bold text-foreground">{count}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </button>
  );
}
