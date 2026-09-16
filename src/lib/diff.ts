import type { Employee, EmployeeDiffChanged, FieldChange, ParsedRow, VersionDiff } from "@/types";

function normalizeStatus(status: string): Employee["status"] {
  return status.trim().toLowerCase() === "desligado" ? "desligado" : "ativo";
}

function makeId() {
  return `emp-${Math.random().toString(36).slice(2, 10)}`;
}

const FIELD_LABELS: { key: "nome" | "email" | "cnpj" | "departamento" | "cargo" | "status"; label: string }[] = [
  { key: "nome", label: "Nome" },
  { key: "email", label: "E-mail corporativo" },
  { key: "cnpj", label: "CNPJ" },
  { key: "departamento", label: "Departamento" },
  { key: "cargo", label: "Cargo" },
  { key: "status", label: "Status" },
];

export interface ComputedDiff {
  diff: VersionDiff;
  nextEmployees: Employee[];
}

export function computeDiff(currentEmployees: Employee[], rows: ParsedRow[], now: string): ComputedDiff {
  const employees = currentEmployees.map((e) => ({ ...e }));
  const byMatricula = new Map(employees.map((e) => [e.matricula.trim().toLowerCase(), e]));
  const seenMatriculas = new Set<string>();

  const novos: Employee[] = [];
  const alterados: EmployeeDiffChanged[] = [];

  for (const row of rows) {
    const key = row.matricula.trim().toLowerCase();
    if (!key) continue;
    seenMatriculas.add(key);
    const existing = byMatricula.get(key);
    const status = normalizeStatus(row.status);
    const departamento = row.departamento as Employee["departamento"];

    if (!existing) {
      const created: Employee = {
        id: makeId(),
        nome: row.nome,
        email: row.email,
        matricula: row.matricula,
        cnpj: row.cnpj,
        departamento,
        cargo: row.cargo,
        status,
        beneficio: "sem_adesao",
        dataEntrada: now,
        dataAtualizacao: now,
      };
      employees.push(created);
      byMatricula.set(key, created);
      novos.push(created);
      continue;
    }

    const wasPending = existing.naoEncontradoNaUltimaBase;
    existing.naoEncontradoNaUltimaBase = false;

    const incoming: Record<string, string> = {
      nome: row.nome, email: row.email, cnpj: row.cnpj, departamento, cargo: row.cargo, status,
    };
    const mudancas: FieldChange[] = [];
    for (const field of FIELD_LABELS) {
      const anterior = String(existing[field.key]);
      const novo = incoming[field.key];
      if (anterior !== novo) {
        mudancas.push({ campo: field.label, anterior, novo });
        (existing as unknown as Record<string, string>)[field.key] = novo;
      }
    }
    if (mudancas.length > 0 || wasPending) {
      existing.dataAtualizacao = now;
    }
    if (mudancas.length > 0) {
      alterados.push({ id: existing.id, nome: existing.nome, matricula: existing.matricula, mudancas });
    }
  }

  const removidos: Employee[] = [];
  for (const employee of employees) {
    if (employee.status !== "ativo") continue;
    const key = employee.matricula.trim().toLowerCase();
    if (!seenMatriculas.has(key)) {
      if (!employee.naoEncontradoNaUltimaBase) {
        removidos.push({ ...employee });
      }
      employee.naoEncontradoNaUltimaBase = true;
    }
  }

  return { diff: { novos, removidos, alterados }, nextEmployees: employees };
}
