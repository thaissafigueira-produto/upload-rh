import { onlyDigits } from "@/lib/cnpj";
import type { ParsedRow, ValidationErrorRow, ValidationSummary } from "@/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUS = ["ativo", "desligado"];

const REQUIRED_FIELDS: { key: keyof ParsedRow; label: string }[] = [
  { key: "nome", label: "Nome" },
  { key: "email", label: "E-mail corporativo" },
  { key: "matricula", label: "Matrícula" },
  { key: "cnpj", label: "CNPJ" },
];

export const PROBLEMA = {
  ausente: "Campo obrigatório não preenchido",
  emailInvalido: "O e-mail não está em um formato válido",
  statusInvalido: 'O status deve ser "Ativo" ou "Desligado"',
  cnpjNaoCadastrado: "Este CNPJ não pertence à sua empresa",
  matriculaDuplicada: "Esta matrícula aparece mais de uma vez no arquivo",
  emailDuplicado: "Este e-mail aparece mais de uma vez no arquivo",
} as const;

export function validateRows(rows: ParsedRow[], cnpjsCadastrados: string[]): ValidationSummary {
  const errosDetalhados: ValidationErrorRow[] = [];
  const rowHasCriticalError = new Set<number>();
  const duplicatedRows = new Set<number>();
  const registered = new Set(cnpjsCadastrados.map(onlyDigits));

  const matriculaSeen = new Map<string, number[]>();
  const emailSeen = new Map<string, number[]>();

  const addError = (row: ParsedRow, campo: string, problema: string) => {
    errosDetalhados.push({ linha: row.linha, colaborador: row.nome || `Linha ${row.linha}`, campo, problema });
    rowHasCriticalError.add(row.linha);
  };

  for (const row of rows) {
    for (const field of REQUIRED_FIELDS) {
      if (!row[field.key]) addError(row, field.label, PROBLEMA.ausente);
    }

    if (row.email && !EMAIL_REGEX.test(row.email)) addError(row, "E-mail corporativo", PROBLEMA.emailInvalido);

    if (row.status && !VALID_STATUS.includes(row.status.trim().toLowerCase())) {
      addError(row, "Status", PROBLEMA.statusInvalido);
    }

    if (row.cnpj && !registered.has(onlyDigits(row.cnpj))) addError(row, "CNPJ", PROBLEMA.cnpjNaoCadastrado);

    if (row.matricula) {
      const key = row.matricula.trim().toLowerCase();
      matriculaSeen.set(key, [...(matriculaSeen.get(key) ?? []), row.linha]);
    }
    if (row.email) {
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
    errosDetalhados,
    temErroCritico: rowHasCriticalError.size > 0,
  };
}
