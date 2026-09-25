import { ChevronRight, Download, FileSpreadsheet, Filter, Search, Users } from "lucide-react";
import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { EmployeeDetailSheet } from "@/components/employees/EmployeeDetailSheet";
import { BeneficiosImportDialog } from "@/components/guapeco/BeneficiosImportDialog";
import { ConferenciaStatusBadge, EmployeeStatusBadge, UploadStatusBadge } from "@/components/status/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { shortRazaoSocial } from "@/lib/cnpj";
import { downloadTextFile } from "@/lib/csv";
import { daysSince, formatCompetencia, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { MODO_LABEL } from "@/lib/modos";
import { cnpjService } from "@/services/cnpjService";
import { useDatabase } from "@/services/database";
import { employeesService } from "@/services/employeesService";
import { guapecoService } from "@/services/guapecoService";
import { uploadsService } from "@/services/uploadsService";
import { versionsService } from "@/services/versionsService";
import type { BenefitStatus } from "@/types";

const PAGE_SIZE = 25;

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function GuapecoEmpresa() {
  useDatabase();
  const { empresaId = "" } = useParams();
  guapecoService.focusEmpresa(empresaId);
  const empresa = guapecoService.getEmpresa(empresaId);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [beneficio, setBeneficio] = useState("todos");
  const [cnpj, setCnpj] = useState("todos");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBeneficio, setBulkBeneficio] = useState<BenefitStatus | "">("");
  const [importOpen, setImportOpen] = useState(false);

  if (!empresa) return <Navigate to="/guapeco" replace />;

  const employees = employeesService.list();
  const cnpjs = cnpjService.list();
  const uploads = uploadsService.list();
  const conferencias = cnpjService.listConferencias();
  const latest = versionsService.latestUpdate();

  const q = normalize(query.trim());
  const filtered = employees
    .filter((e) => {
      if (status !== "todos" && e.status !== status) return false;
      if (beneficio !== "todos" && e.beneficio !== beneficio) return false;
      if (cnpj === "sem_cnpj" ? e.cnpj !== "" : cnpj !== "todos" && e.cnpj !== cnpj) return false;
      return !q || normalize(e.nome).includes(q) || normalize(e.email).includes(q) || normalize(e.matricula).includes(q);
    })
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1));
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const allOnPageSelected = pageItems.length > 0 && pageItems.every((e) => selected.has(e.id));
  const naBase = employees.filter((e) => e.status !== "desligado");

  const change = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(0);
  };

  function exportBase() {
    const csv = employeesService.exportBaseCsv();
    if (csv) {
      downloadTextFile(csv.filename, csv.content);
      toast.success("Base exportada.");
    }
  }

  function exportResumo(conferenciaId: string) {
    const csv = cnpjService.exportResumoCsv(conferenciaId);
    if (csv) downloadTextFile(csv.filename, csv.content);
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "Empresas", to: "/guapeco" }, { label: empresa.nome }]}
        title={empresa.nome}
        subtitle="Consulta da base da empresa e atualização do benefício dos colaboradores."
        glossary={false}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}><FileSpreadsheet />Atualizar benefícios por planilha</Button>
            <Button onClick={exportBase}><Download />Exportar base (CSV)</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Colaboradores na base" value={formatNumber(naBase.length)} />
        <MetricCard label="Com adesão" value={formatNumber(naBase.filter((e) => e.beneficio === "com_adesao").length)} />
        <MetricCard
          label="Última atualização da base"
          value={latest ? formatDate(latest.version.data) : "—"}
          context={latest ? `há ${daysSince(latest.version.data)} dias · por ${latest.version.usuario}` : "Nenhuma atualização"}
        />
        <MetricCard
          label="Não encontrados"
          value={formatNumber(employees.filter((e) => e.status === "nao_encontrado").length)}
          context="Aguardando revisão do RH"
        />
      </div>

      <Tabs defaultValue="colaboradores" className="mt-8">
        <TabsList>
          <TabsTrigger value="colaboradores">Colaboradores ({formatNumber(employees.length)})</TabsTrigger>
          <TabsTrigger value="atualizacoes">Atualizações da base ({uploads.length})</TabsTrigger>
          <TabsTrigger value="conferencias">Conferências de CNPJ ({conferencias.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="colaboradores" className="mt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome, e-mail ou matrícula" className="pl-10" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex items-center gap-1.5 self-end text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover sm:self-auto"
            >
              <Filter className="size-4" />
              Filtrar
            </button>
          </div>

          {filtersOpen && (
            <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-muted p-4 sm:flex-row sm:flex-wrap">
              <Select value={status} onValueChange={change(setStatus)}>
                <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="nao_encontrado">Não encontrado na última base</SelectItem>
                  <SelectItem value="desligado">Desligado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={beneficio} onValueChange={change(setBeneficio)}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Benefício" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os benefícios</SelectItem>
                  <SelectItem value="com_adesao">Com adesão</SelectItem>
                  <SelectItem value="sem_adesao">Sem adesão</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cnpj} onValueChange={change(setCnpj)}>
                <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="CNPJ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os CNPJs</SelectItem>
                  <SelectItem value="sem_cnpj">Sem CNPJ definido</SelectItem>
                  {cnpjs.map((c) => <SelectItem key={c.id} value={c.cnpj}>{shortRazaoSocial(c.razaoSocial)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {selected.size > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-lilac-soft px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{selected.size} {selected.size === 1 ? "colaborador selecionado" : "colaboradores selecionados"}</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Limpar seleção</Button>
                <Button size="sm" onClick={() => { setBulkBeneficio(""); setBulkOpen(true); }}>Alterar benefício</Button>
              </div>
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-2xl border border-border">
            {filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={Users} title="Nenhum colaborador encontrado" description="Ajuste a busca ou os filtros." />
              </div>
            ) : (
              <Table className="text-[0.82rem]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10">
                      <Checkbox
                        aria-label="Selecionar todos desta página"
                        checked={allOnPageSelected}
                        onCheckedChange={(checked) => setSelected((prev) => {
                          const next = new Set(prev);
                          pageItems.forEach((e) => (checked ? next.add(e.id) : next.delete(e.id)));
                          return next;
                        })}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Benefício</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((e) => {
                    const razao = cnpjs.find((c) => c.cnpj === e.cnpj)?.razaoSocial;
                    return (
                      <TableRow key={e.id} className="cursor-pointer" data-state={selected.has(e.id) ? "selected" : undefined} onClick={() => setOpenId(e.id)}>
                        <TableCell onClick={(ev) => ev.stopPropagation()}>
                          <Checkbox
                            aria-label={`Selecionar ${e.nome}`}
                            checked={selected.has(e.id)}
                            onCheckedChange={(checked) => setSelected((prev) => {
                              const next = new Set(prev);
                              if (checked === true) next.add(e.id);
                              else next.delete(e.id);
                              return next;
                            })}
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {e.nome}
                          <span className="block max-w-[15rem] truncate text-xs font-normal text-muted-foreground">{e.email}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{e.matricula}</TableCell>
                        <TableCell className="text-muted-foreground">{e.cnpj ? (razao ? shortRazaoSocial(razao) : e.cnpj) : <span className="text-warning">Sem CNPJ</span>}</TableCell>
                        <TableCell className="text-muted-foreground">{e.departamento || "—"}</TableCell>
                        <TableCell><EmployeeStatusBadge status={e.status} compact /></TableCell>
                        <TableCell onClick={(ev) => ev.stopPropagation()}>
                          <Select
                            value={e.beneficio}
                            onValueChange={(value) => {
                              employeesService.updateBeneficio(e.id, value as BenefitStatus);
                              toast.success(`Benefício de ${e.nome} atualizado.`);
                            }}
                          >
                            <SelectTrigger className="h-8 w-36" aria-label={`Benefício de ${e.nome}`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="com_adesao">Com adesão</SelectItem>
                              <SelectItem value="sem_adesao">Sem adesão</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><ChevronRight className="size-4 text-primary" /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
          <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </TabsContent>

        <TabsContent value="atualizacoes" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data e hora</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Tipo de envio</TableHead>
                  <TableHead className="text-right">Novos</TableHead>
                  <TableHead className="text-right">Não encontrados</TableHead>
                  <TableHead className="text-right">Alterados</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.map((u) => (
                  <TableRow key={u.id} className="hover:bg-transparent">
                    <TableCell className="font-semibold text-foreground">{formatDateTime(u.data)}</TableCell>
                    <TableCell className="text-muted-foreground">{u.usuario}</TableCell>
                    <TableCell className="text-muted-foreground">{u.arquivo}</TableCell>
                    <TableCell className="text-muted-foreground">{MODO_LABEL[u.modo]}</TableCell>
                    <TableCell className="text-right text-success">{u.status === "confirmada" ? `+${u.novos}` : "—"}</TableCell>
                    <TableCell className="text-right text-warning">{u.status === "confirmada" ? u.naoEncontrados : "—"}</TableCell>
                    <TableCell className="text-right text-foreground">{u.status === "confirmada" ? u.alterados : "—"}</TableCell>
                    <TableCell><UploadStatusBadge status={u.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="conferencias" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Competência</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confirmado por</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {conferencias.map((c) => (
                  <TableRow key={c.id} className="hover:bg-transparent">
                    <TableCell className="font-semibold text-foreground first-letter:uppercase">{formatCompetencia(c.competencia)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(c.prazo)}</TableCell>
                    <TableCell><ConferenciaStatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{c.confirmadoPor ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.confirmadoEm ? formatDateTime(c.confirmadoEm) : "—"}</TableCell>
                    <TableCell className="text-right">
                      {c.status === "confirmada" && (
                        <Button variant="outline" size="sm" onClick={() => exportResumo(c.id)}>
                          <Download />
                          Baixar resumo (CSV)
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            O resumo de uma conferência confirmada lista os colaboradores com adesão de cada CNPJ, para emitir notas fiscais e boletos.
          </p>
        </TabsContent>
      </Tabs>

      <EmployeeDetailSheet employeeId={openId} onClose={() => setOpenId(null)} />
      <BeneficiosImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar benefício em massa</DialogTitle>
            <DialogDescription>
              O benefício de {selected.size} {selected.size === 1 ? "colaborador será alterado" : "colaboradores será alterado"}. Escolha a nova situação.
            </DialogDescription>
          </DialogHeader>
          <Select value={bulkBeneficio} onValueChange={(v) => setBulkBeneficio(v as BenefitStatus)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o benefício" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="com_adesao">Com adesão</SelectItem>
              <SelectItem value="sem_adesao">Sem adesão</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancelar</Button>
            <Button
              disabled={!bulkBeneficio}
              onClick={() => {
                if (!bulkBeneficio) return;
                employeesService.bulkUpdateBeneficio([...selected], bulkBeneficio);
                toast.success(`Benefício de ${selected.size} ${selected.size === 1 ? "colaborador atualizado" : "colaboradores atualizados"}.`);
                setSelected(new Set());
                setBulkOpen(false);
              }}
            >
              Alterar benefício
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
