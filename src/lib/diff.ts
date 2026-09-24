import { onlyDigits } from "@/lib/cnpj";
import type { Cnpj, Employee, EmployeeDiffChanged, EmployeeStatus, FieldChange, ParsedRow, VersionDiff } from "@/types";

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

/** Compara a nova base com a base atual da empresa. Quem sumiu da planilha não é apagado:
 * passa a "Não encontrado na última base" para o RH decidir. */
export function computeDiff(
  currentEmployees: Employee[],
  rows: ParsedRow[],
  cnpjs: Cnpj[],
  empresaId: string,
  now: string,
): ComputedDiff {
  const employees = currentEmployees.map((e) => ({ ...e }));
  const byMatricula = new Map(employees.map((e) => [e.matricula.trim().toLowerCase(), e]));
  const cnpjByDigits = new Map(cnpjs.map((c) => [onlyDigits(c.cnpj), c.cnpj]));
  const seenMatriculas = new Set<string>();

  const novos: Employee[] = [];
  const alterados: EmployeeDiffChanged[] = [];

  for (const row of rows) {
    const key = row.matricula.trim().toLowerCase();
    if (!key) continue;
    seenMatriculas.add(key);
    const existing = byMatricula.get(key);
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
        status,
        beneficio: "sem_adesao",
        dataEntrada: now,
        dataAtualizacao: now,
        dataDesligamento: status === "desligado" ? now : undefined,
      };
      employees.push(created);
      byMatricula.set(key, created);
      novos.push(created);
      continue;
    }

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
    compare("Status", STATUS_LABEL[existing.status], STATUS_LABEL[incomingStatus]);

    if (mudancas.length > 0) {
      existing.nome = row.nome;
      existing.email = row.email;
      existing.cnpj = cnpj;
      if (row.departamento) existing.departamento = row.departamento;
      if (row.cargo) existing.cargo = row.cargo;
      if (existing.status !== incomingStatus) {
        existing.status = incomingStatus;
        existing.dataDesligamento = incomingStatus === "desligado" ? now : undefined;
      }
      existing.dataAtualizacao = now;
      alterados.push({ id: existing.id, nome: existing.nome, matricula: existing.matricula, mudancas });
    }
  }

  const naoEncontrados: Employee[] = [];
  for (const employee of employees) {
    if (employee.status !== "ativo") continue;
    if (seenMatriculas.has(employee.matricula.trim().toLowerCase())) continue;
    naoEncontrados.push({ ...employee });
    employee.status = "nao_encontrado";
    employee.dataAtualizacao = now;
  }

  return { diff: { novos, naoEncontrados, alterados }, nextEmployees: employees };
}
