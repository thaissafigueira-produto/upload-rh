import { format } from "date-fns";
import { ChevronRight, Filter, Search, UploadCloud, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { EmployeeDetailSheet } from "@/components/employees/EmployeeDetailSheet";
import { BenefitStatusBadge, EmployeeStatusBadge } from "@/components/status/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { shortRazaoSocial } from "@/lib/cnpj";
import { formatDate } from "@/lib/format";
import { cnpjService } from "@/services/cnpjService";
import { useDatabase } from "@/services/database";
import { employeesService } from "@/services/employeesService";

const PAGE_SIZE = 25;
const VALID_STATUS = ["ativo", "nao_encontrado", "desligado"];

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function Colaboradores() {
  useDatabase();
  const [searchParams] = useSearchParams();
  const employees = employeesService.list();
  const cnpjs = cnpjService.list();
  const departamentos = employeesService.departamentos();

  const initialStatus = searchParams.get("status") ?? "todos";
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(VALID_STATUS.includes(initialStatus) ? initialStatus : "todos");
  const [beneficio, setBeneficio] = useState("todos");
  const [cnpj, setCnpj] = useState("todos");
  const [departamento, setDepartamento] = useState("todos");
  const [filtersOpen, setFiltersOpen] = useState(initialStatus !== "todos");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkKind, setBulkKind] = useState<"cnpj" | "departamento" | "desligar" | null>(null);
  const [bulkValue, setBulkValue] = useState("");
  const [bulkDate, setBulkDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const cnpjsAtivos = cnpjService.listAtivos();

  const hasFilters = status !== "todos" || beneficio !== "todos" || cnpj !== "todos" || departamento !== "todos";

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return employees
      .filter((e) => {
        if (status !== "todos" && e.status !== status) return false;
        if (beneficio !== "todos" && e.beneficio !== beneficio) return false;
        if (cnpj === "sem_cnpj" ? e.cnpj !== "" : cnpj !== "todos" && e.cnpj !== cnpj) return false;
        if (departamento !== "todos" && e.departamento !== departamento) return false;
        if (!q) return true;
        return normalize(e.nome).includes(q) || normalize(e.email).includes(q) || normalize(e.matricula).includes(q);
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [employees, query, status, beneficio, cnpj, departamento]);

  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1));
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const change = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(0);
  };

  const allOnPageSelected = pageItems.length > 0 && pageItems.every((e) => selected.has(e.id));
  const selectedCount = selected.size;

  function applyBulk() {
    const ids = [...selected];
    if (bulkKind === "cnpj" && bulkValue) employeesService.bulkUpdateCnpj(ids, bulkValue);
    else if (bulkKind === "departamento" && bulkValue.trim()) employeesService.bulkUpdateDepartamento(ids, bulkValue.trim());
    else if (bulkKind === "desligar" && bulkDate) employeesService.bulkMarkAsDesligado(ids, bulkDate);
    else return;
    toast.success(`${ids.length} ${ids.length === 1 ? "colaborador atualizado" : "colaboradores atualizados"}.`);
    setSelected(new Set());
    setBulkKind(null);
  }

  function clearFilters() {
    setStatus("todos");
    setBeneficio("todos");
    setCnpj("todos");
    setDepartamento("todos");
    setPage(0);
  }

  return (
    <div>
      <PageHeader
        title="Colaboradores"
        subtitle="Consulte e gerencie a população de colaboradores da sua empresa."
        action={
          <Button asChild>
            <Link to="/atualizar-base">
              <UploadCloud />
              Atualizar base
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou matrícula"
            className="pl-10"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="flex items-center gap-1.5 self-end text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover sm:self-auto"
        >
          <Filter className="size-4" />
          Filtrar{hasFilters ? " (ativos)" : ""}
        </button>
      </div>

      {filtersOpen && (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-muted p-4 sm:flex-row sm:flex-wrap sm:items-center">
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
          <Select value={departamento} onValueChange={change(setDepartamento)}>
            <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os departamentos</SelectItem>
              {departamentos.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="text-sm font-semibold text-primary underline underline-offset-4">
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {selectedCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-lilac-soft px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {selectedCount} {selectedCount === 1 ? "colaborador selecionado" : "colaboradores selecionados"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Limpar seleção</Button>
            <Button variant="outline" size="sm" onClick={() => { setBulkValue(""); setBulkKind("cnpj"); }}>Alterar CNPJ</Button>
            <Button variant="outline" size="sm" onClick={() => { setBulkValue(""); setBulkKind("departamento"); }}>Alterar departamento</Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setBulkKind("desligar")}>
              Marcar como desligado
            </Button>
          </div>
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-border">
        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Users}
              title="Nenhum colaborador encontrado"
              description="Ajuste a busca ou os filtros para encontrar o colaborador que você procura."
            />
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
                <TableHead>E-mail corporativo</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Benefício</TableHead>
                <TableHead>Última atualização</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((e) => {
                const razao = cnpjs.find((c) => c.cnpj === e.cnpj)?.razaoSocial;
                return (
                  <TableRow key={e.id} className="cursor-pointer" data-state={selected.has(e.id) ? "selected" : undefined} onClick={() => setSelectedId(e.id)}>
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
                    <TableCell className="font-semibold text-foreground">{e.nome}</TableCell>
                    <TableCell className="max-w-[13rem] truncate text-muted-foreground" title={e.email}>{e.email}</TableCell>
                    <TableCell className="text-muted-foreground">{e.matricula}</TableCell>
                    <TableCell>
                      {e.cnpj ? (
                        <span>
                          <span className="block text-foreground">{razao ? shortRazaoSocial(razao) : "—"}</span>
                          <span className="text-xs text-muted-foreground">{e.cnpj}</span>
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-warning">Sem CNPJ</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.departamento || "—"}</TableCell>
                    <TableCell><EmployeeStatusBadge status={e.status} compact /></TableCell>
                    <TableCell><BenefitStatusBadge status={e.beneficio} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(e.dataAtualizacao)}</TableCell>
                    <TableCell><ChevronRight className="size-4 text-primary" /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />

      <EmployeeDetailSheet employeeId={selectedId} onClose={() => setSelectedId(null)} />

      <Dialog open={bulkKind !== null} onOpenChange={(open) => !open && setBulkKind(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkKind === "cnpj" && "Alterar CNPJ em massa"}
              {bulkKind === "departamento" && "Alterar departamento em massa"}
              {bulkKind === "desligar" && "Marcar como desligados?"}
            </DialogTitle>
            <DialogDescription>
              {bulkKind === "desligar"
                ? `Tem certeza que deseja marcar ${selectedCount} ${selectedCount === 1 ? "colaborador" : "colaboradores"} como desligado(s)? Quem tiver adesão ao benefício será informado à Guapeco.`
                : `A alteração vale para ${selectedCount} ${selectedCount === 1 ? "colaborador selecionado" : "colaboradores selecionados"} e fica registrada na linha do tempo de cada um.`}
            </DialogDescription>
          </DialogHeader>
          {bulkKind === "cnpj" && (
            <Select value={bulkValue} onValueChange={setBulkValue}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o CNPJ" /></SelectTrigger>
              <SelectContent>
                {cnpjsAtivos.map((c) => <SelectItem key={c.id} value={c.cnpj}>{shortRazaoSocial(c.razaoSocial)} — {c.cnpj}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {bulkKind === "departamento" && (
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
              Novo departamento
              <Input value={bulkValue} list="bulk-departamentos" onChange={(e) => setBulkValue(e.target.value)} />
              <datalist id="bulk-departamentos">
                {departamentos.map((d) => <option key={d} value={d} />)}
              </datalist>
            </label>
          )}
          {bulkKind === "desligar" && (
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
              Data do desligamento
              <Input type="date" value={bulkDate} max={format(new Date(), "yyyy-MM-dd")} onChange={(e) => setBulkDate(e.target.value)} />
            </label>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkKind(null)}>Cancelar</Button>
            <Button
              variant={bulkKind === "desligar" ? "destructive" : "default"}
              disabled={bulkKind === "desligar" ? !bulkDate : !bulkValue.trim()}
              onClick={applyBulk}
            >
              {bulkKind === "desligar" ? "Marcar como desligados" : "Aplicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
