import { onlyDigits } from "@/lib/cnpj";
import { normalizeDate, todayIsoDate } from "@/lib/dates";
import type { EmployeeStatus, ModoEnvio, ParsedRow, ValidationErrorRow, ValidationSummary } from "@/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUS = ["ativo", "desligado"];

const REQUIRED_CADASTRO: { key: keyof ParsedRow; label: string }[] = [
  { key: "nome", label: "Nome" },
  { key: "email", label: "E-mail corporativo" },
  { key: "matricula", label: "Matrícula" },
  { key: "cnpj", label: "CNPJ" },
];

const REQUIRED_DESLIGAMENTO: { key: keyof ParsedRow; label: string }[] = [
  { key: "matricula", label: "Matrícula" },
  { key: "dataDesligamento", label: "Data de desligamento" },
];

export const PROBLEMA = {
  ausente: "Campo obrigatório não preenchido",
  emailInvalido: "O e-mail não está em um formato válido",
  statusInvalido: 'O status deve ser "Ativo" ou "Desligado"',
  cnpjNaoCadastrado: "Este CNPJ não pertence à sua empresa",
  matriculaDuplicada: "Esta matrícula aparece mais de uma vez no arquivo",
  emailDuplicado: "Este e-mail aparece mais de uma vez no arquivo",
  matriculaJaExiste: "Esta matrícula já existe na base. Use a base completa para atualizar dados de quem já está na base",
  matriculaNaoEncontrada: "Esta matrícula não foi encontrada na base",
  jaDesligado: "Este colaborador já está desligado",
  dataInvalida: "A data de desligamento não está em um formato válido (use dd/mm/aaaa)",
  dataFutura: "A data de desligamento não pode ser no futuro",
} as const;

const PROBLEMAS_DE_BASE: string[] = [
  PROBLEMA.matriculaJaExiste, PROBLEMA.matriculaNaoEncontrada, PROBLEMA.jaDesligado, PROBLEMA.dataInvalida, PROBLEMA.dataFutura,
];

export interface ValidationOptions {
  cnpjs: string[];
  modo: ModoEnvio;
  /** Matrícula (minúscula) → status atual de quem já está na base. */
  base: Map<string, EmployeeStatus>;
}

export function validateRows(rows: ParsedRow[], { cnpjs, modo, base }: ValidationOptions): ValidationSummary {
  const errosDetalhados: ValidationErrorRow[] = [];
  const rowHasCriticalError = new Set<number>();
  const duplicatedRows = new Set<number>();
  const registered = new Set(cnpjs.map(onlyDigits));
  const today = todayIsoDate();

  const matriculaSeen = new Map<string, number[]>();
  const emailSeen = new Map<string, number[]>();

  const addError = (row: ParsedRow, campo: string, problema: string) => {
    errosDetalhados.push({ linha: row.linha, colaborador: row.nome || row.matricula || `Linha ${row.linha}`, campo, problema });
    rowHasCriticalError.add(row.linha);
  };

  for (const row of rows) {
    const required = modo === "desligamentos" ? REQUIRED_DESLIGAMENTO : REQUIRED_CADASTRO;
    for (const field of required) {
      if (!row[field.key]) addError(row, field.label, PROBLEMA.ausente);
    }

    const matriculaKey = row.matricula.trim().toLowerCase();

    if (modo === "desligamentos") {
      if (row.matricula) {
        const status = base.get(matriculaKey);
        if (status === undefined) addError(row, "Matrícula", PROBLEMA.matriculaNaoEncontrada);
        else if (status === "desligado") addError(row, "Matrícula", PROBLEMA.jaDesligado);
      }
      if (row.dataDesligamento) {
        const date = normalizeDate(row.dataDesligamento);
        if (!date) addError(row, "Data de desligamento", PROBLEMA.dataInvalida);
        else if (date > today) addError(row, "Data de desligamento", PROBLEMA.dataFutura);
      }
    } else {
      if (row.email && !EMAIL_REGEX.test(row.email)) addError(row, "E-mail corporativo", PROBLEMA.emailInvalido);
      if (row.status && !VALID_STATUS.includes(row.status.trim().toLowerCase())) addError(row, "Status", PROBLEMA.statusInvalido);
      if (row.cnpj && !registered.has(onlyDigits(row.cnpj))) addError(row, "CNPJ", PROBLEMA.cnpjNaoCadastrado);
      if (row.dataDesligamento) {
        const date = normalizeDate(row.dataDesligamento);
        if (!date) addError(row, "Data de desligamento", PROBLEMA.dataInvalida);
        else if (date > today) addError(row, "Data de desligamento", PROBLEMA.dataFutura);
      }
      if (modo === "novos" && row.matricula && base.has(matriculaKey)) {
        addError(row, "Matrícula", PROBLEMA.matriculaJaExiste);
      }
    }

    if (row.matricula) matriculaSeen.set(matriculaKey, [...(matriculaSeen.get(matriculaKey) ?? []), row.linha]);
    if (row.email && modo !== "desligamentos") {
      const key = row.email.trim().toLowerCase();
      emailSeen.set(key, [...(emailSeen.get(key) ?? []), row.linha]);
    }
  }

  const byLine = new Map(rows.map((r) => [r.linha, r]));
  for (const [, linhas] of matriculaSeen) {
    if (linhas.length < 2) continue;
    for (const linha of linhas) {
      duplicatedRows.add(linha);
      addError(byLine.get(linha)!, "Matrícula", PROBLEMA.matriculaDuplicada);
    }
  }
  for (const [, linhas] of emailSeen) {
    if (linhas.length < 2) continue;
    for (const linha of linhas) {
      duplicatedRows.add(linha);
      addError(byLine.get(linha)!, "E-mail corporativo", PROBLEMA.emailDuplicado);
    }
  }

  const count = (problema: string) => errosDetalhados.filter((e) => e.problema === problema).length;

  errosDetalhados.sort((a, b) => a.linha - b.linha);

  return {
    totalRegistros: rows.length,
    registrosValidos: rows.length - rowHasCriticalError.size,
    erros: rowHasCriticalError.size,
    duplicados: duplicatedRows.size,
    emailsInvalidos: count(PROBLEMA.emailInvalido),
    camposObrigatoriosAusentes: count(PROBLEMA.ausente),
    cnpjsNaoCadastrados: count(PROBLEMA.cnpjNaoCadastrado),
    problemasDeBase: errosDetalhados.filter((e) => PROBLEMAS_DE_BASE.includes(e.problema)).length,
    errosDetalhados,
    temErroCritico: rowHasCriticalError.size > 0,
  };
}
