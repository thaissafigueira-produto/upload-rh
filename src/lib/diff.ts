import { onlyDigits } from "@/lib/cnpj";
import { isoDateToBR, isoDateToNoon, normalizeDate } from "@/lib/dates";
import type {
  Cnpj, Employee, EmployeeDiffChanged, EmployeeStatus, FieldChange, ModoEnvio, ParsedRow, VersionDiff,
} from "@/types";

export const STATUS_LABEL: Record<EmployeeStatus, string> = {
  ativo: "Ativo",
  nao_encontrado: "Não encontrado na última base",
  desligado: "Desligado",
};

function makeId() {
  return `emp-${Math.random().toString(36).slice(2, 10)}`;
}

export interface ComputedDiff {
  diff: VersionDiff;
  nextEmployees: Employee[];
}

/** Compara o arquivo com a base atual. Na base completa, quem sumiu da planilha não é apagado:
 * passa a "Não encontrado na última base" para o RH decidir. Nos envios parciais (só novos ou só
 * desligamentos) ninguém é marcado como não encontrado. */
export function computeDiff(
  currentEmployees: Employee[],
  rows: ParsedRow[],
  cnpjs: Cnpj[],
  empresaId: string,
  now: string,
  modo: ModoEnvio = "completa",
): ComputedDiff {
  const employees = currentEmployees.map((e) => ({ ...e }));
  const byMatricula = new Map(employees.map((e) => [e.matricula.trim().toLowerCase(), e]));
  const cnpjByDigits = new Map(cnpjs.map((c) => [onlyDigits(c.cnpj), c.cnpj]));
  const seenMatriculas = new Set<string>();

  const novos: Employee[] = [];
  const alterados: EmployeeDiffChanged[] = [];

  const desligamentoIso = (row: ParsedRow) => {
    const date = normalizeDate(row.dataDesligamento);
    return date ? isoDateToNoon(date) : now;
  };

  for (const row of rows) {
    const key = row.matricula.trim().toLowerCase();
    if (!key) continue;
    seenMatriculas.add(key);
    const existing = byMatricula.get(key);

    if (modo === "desligamentos") {
      if (!existing) continue;
      const quando = desligamentoIso(row);
      const mudancas: FieldChange[] = [
        { campo: "Status", anterior: STATUS_LABEL[existing.status], novo: STATUS_LABEL.desligado },
        { campo: "Data de desligamento", anterior: "—", novo: isoDateToBR(quando.slice(0, 10)) },
      ];
      existing.status = "desligado";
      existing.dataDesligamento = quando;
      existing.dataAtualizacao = now;
      alterados.push({ id: existing.id, nome: existing.nome, matricula: existing.matricula, mudancas });
      continue;
    }

    const cnpj = cnpjByDigits.get(onlyDigits(row.cnpj)) ?? row.cnpj;
    const incomingRaw = row.status.trim().toLowerCase();

    if (!existing) {
      const status: EmployeeStatus = incomingRaw === "desligado" ? "desligado" : "ativo";
      const created: Employee = {
        id: makeId(),
        empresaId,
        nome: row.nome,
        email: row.email,
        matricula: row.matricula,
        cnpj,
        departamento: row.departamento,
        cargo: row.cargo,
        telefone: row.telefone,
        status,
        beneficio: "sem_adesao",
        dataEntrada: now,
        dataAtualizacao: now,
        dataDesligamento: status === "desligado" ? desligamentoIso(row) : undefined,
      };
      employees.push(created);
      byMatricula.set(key, created);
      novos.push(created);
      continue;
    }

    if (modo === "novos") continue;

    const incomingStatus: EmployeeStatus =
      incomingRaw === "desligado" ? "desligado" : incomingRaw === "ativo" ? "ativo" : existing.status === "desligado" ? "desligado" : "ativo";

    const mudancas: FieldChange[] = [];
    const compare = (campo: string, anterior: string, novo: string, destaque = false) => {
      if (anterior !== novo) mudancas.push({ campo, anterior, novo, destaque });
    };

    compare("Nome", existing.nome, row.nome);
    compare("E-mail corporativo", existing.email, row.email);
    compare("CNPJ", existing.cnpj, cnpj, true);
    if (row.departamento) compare("Departamento", existing.departamento, row.departamento);
    if (row.cargo) compare("Cargo", existing.cargo, row.cargo);
    if (row.telefone) compare("Telefone", existing.telefone, row.telefone);
    compare("Status", STATUS_LABEL[existing.status], STATUS_LABEL[incomingStatus]);
    const quando = incomingStatus === "desligado" && existing.status !== "desligado" ? desligamentoIso(row) : undefined;
    if (quando) mudancas.push({ campo: "Data de desligamento", anterior: "—", novo: isoDateToBR(quando.slice(0, 10)) });

    if (mudancas.length > 0) {
      existing.nome = row.nome;
      existing.email = row.email;
      existing.cnpj = cnpj;
      if (row.departamento) existing.departamento = row.departamento;
      if (row.cargo) existing.cargo = row.cargo;
      if (row.telefone) existing.telefone = row.telefone;
      if (existing.status !== incomingStatus) {
        existing.status = incomingStatus;
        existing.dataDesligamento = quando;
      }
      existing.dataAtualizacao = now;
      alterados.push({ id: existing.id, nome: existing.nome, matricula: existing.matricula, mudancas });
    }
  }

  const naoEncontrados: Employee[] = [];
  if (modo === "completa") {
    for (const employee of employees) {
      if (employee.status !== "ativo") continue;
      if (seenMatriculas.has(employee.matricula.trim().toLowerCase())) continue;
      naoEncontrados.push({ ...employee });
      employee.status = "nao_encontrado";
      employee.dataAtualizacao = now;
    }
  }

  return { diff: { novos, naoEncontrados, alterados }, nextEmployees: employees };
}
