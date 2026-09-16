import { ChevronLeft, ChevronRight, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { EmployeeDetailSheet } from "@/components/employees/EmployeeDetailSheet";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { BenefitStatusBadge, EmployeeStatusBadge, PendingBadge } from "@/components/status/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Department, Employee } from "@/types";

const DEPARTMENTS: Department[] = ["Tecnologia", "RH", "Financeiro", "Comercial", "Marketing", "Operações"];
const PAGE_SIZE = 20;

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function Colaboradores() {
  const { employees, company } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("todos");
  const [beneficio, setBeneficio] = useState<string>("todos");
  const [cnpj, setCnpj] = useState<string>("todos");
  const [departamento, setDepartamento] = useState<string>("todos");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return employees.filter((e) => {
      if (status !== "todos" && e.status !== status) return false;
      if (beneficio !== "todos" && e.beneficio !== beneficio) return false;
      if (cnpj !== "todos" && e.cnpj !== cnpj) return false;
      if (departamento !== "todos" && e.departamento !== departamento) return false;
      if (!q) return true;
      return (
        normalize(e.nome).includes(q) ||
        normalize(e.email).includes(q) ||
        normalize(e.matricula).includes(q)
      );
    });
  }, [employees, query, status, beneficio, cnpj, departamento]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const resetPage = () => setPage(0);

  const distribuicaoPorCnpj = useMemo(() => {
    const ativos = employees.filter((e) => e.status === "ativo");
    return company.cnpjs.map((c) => ({
      ...c,
      quantidade: ativos.filter((e) => e.cnpj === c.cnpj).length,
    }));
  }, [employees, company.cnpjs]);

  return (
    <div>
      <PageHeader
        title="Colaboradores"
        subtitle="Consulte e gerencie a população de colaboradores da sua empresa."
      />

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Distribuição por CNPJ</p>
          <div className="flex flex-1 flex-wrap gap-x-8 gap-y-2">
            {distribuicaoPorCnpj.map((c) => (
              <button
                key={c.cnpj}
                type="button"
                onClick={() => { setCnpj(c.cnpj); resetPage(); }}
                className="text-left transition-opacity hover:opacity-70"
              >
                <p className="text-sm font-medium text-foreground">{c.razaoSocial}</p>
                <p className="text-xs text-muted-foreground">{c.cnpj} · {c.quantidade} colaboradores</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou matrícula"
            className="pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); resetPage(); }}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="desligado">Desligado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={beneficio} onValueChange={(v) => { setBeneficio(v); resetPage(); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Benefício" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os benefícios</SelectItem>
            <SelectItem value="com_adesao">Com adesão</SelectItem>
            <SelectItem value="sem_adesao">Sem adesão</SelectItem>
          </SelectContent>
        </Select>
        <Select value={departamento} onValueChange={(v) => { setDepartamento(v); resetPage(); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Departamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os departamentos</SelectItem>
            {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={cnpj} onValueChange={(v) => { setCnpj(v); resetPage(); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="CNPJ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os CNPJs</SelectItem>
            {company.cnpjs.map((c) => <SelectItem key={c.cnpj} value={c.cnpj}>{c.cnpj}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-border">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum colaborador encontrado"
            description="Ajuste a busca ou os filtros para encontrar o colaborador que você procura."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>E-mail corporativo</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Benefício</TableHead>
                <TableHead>Última atualização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((employee) => (
                <TableRow
                  key={employee.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(employee)}
                >
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {employee.nome}
                      {employee.naoEncontradoNaUltimaBase && <PendingBadge />}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                  <TableCell className="text-muted-foreground">{employee.matricula}</TableCell>
                  <TableCell className="text-muted-foreground">{employee.cnpj}</TableCell>
                  <TableCell className="text-muted-foreground">{employee.departamento}</TableCell>
                  <TableCell><EmployeeStatusBadge status={employee.status} /></TableCell>
                  <TableCell><BenefitStatusBadge status={employee.beneficio} /></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(employee.dataAtualizacao)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Mostrando {currentPage * PAGE_SIZE + 1}–{Math.min(filtered.length, (currentPage + 1) * PAGE_SIZE)} de {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="flex size-7 items-center justify-center rounded-md border border-border disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-2">{currentPage + 1} / {totalPages}</span>
            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="flex size-7 items-center justify-center rounded-md border border-border disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      <EmployeeDetailSheet employee={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
