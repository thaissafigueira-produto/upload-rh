import type { ParsedRow, ValidationErrorRow, ValidationSummary } from "@/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUS = ["ativo", "desligado"];

const REQUIRED_FIELDS: { key: keyof ParsedRow; label: string }[] = [
  { key: "nome", label: "Nome" },
  { key: "email", label: "E-mail corporativo" },
  { key: "matricula", label: "Matrícula" },
  { key: "cnpj", label: "CNPJ" },
  { key: "departamento", label: "Departamento" },
  { key: "cargo", label: "Cargo" },
  { key: "status", label: "Status" },
];

export function validateRows(rows: ParsedRow[]): ValidationSummary {
  const errosDetalhados: ValidationErrorRow[] = [];
  const rowHasCriticalError = new Set<number>();

  const matriculaSeen = new Map<string, number[]>();
  const emailSeen = new Map<string, number[]>();

  for (const row of rows) {
    const nomeExibicao = row.nome || `Linha ${row.linha}`;

    for (const field of REQUIRED_FIELDS) {
      if (!row[field.key]) {
        errosDetalhados.push({
          linha: row.linha,
          colaborador: nomeExibicao,
          campo: field.label,
          problema: "Campo obrigatório ausente",
        });
        rowHasCriticalError.add(row.linha);
      }
    }

    if (row.email && !EMAIL_REGEX.test(row.email)) {
      errosDetalhados.push({
        linha: row.linha,
        colaborador: nomeExibicao,
        campo: "E-mail corporativo",
        problema: "Formato de e-mail inválido",
      });
      rowHasCriticalError.add(row.linha);
    }

    if (row.status && !VALID_STATUS.includes(row.status.trim().toLowerCase())) {
      errosDetalhados.push({
        linha: row.linha,
        colaborador: nomeExibicao,
        campo: "Status",
        problema: 'Status deve ser "Ativo" ou "Desligado"',
      });
      rowHasCriticalError.add(row.linha);
    }

    if (row.matricula) {
      const key = row.matricula.trim().toLowerCase();
      matriculaSeen.set(key, [...(matriculaSeen.get(key) ?? []), row.linha]);
    }
    if (row.email) {
      const key = row.email.trim().toLowerCase();
      emailSeen.set(key, [...(emailSeen.get(key) ?? []), row.linha]);
    }
  }

  let duplicados = 0;
  for (const [, linhas] of matriculaSeen) {
    if (linhas.length > 1) {
      duplicados += linhas.length;
      for (const linha of linhas) {
        const row = rows.find((r) => r.linha === linha)!;
        errosDetalhados.push({
          linha,
          colaborador: row.nome || `Linha ${linha}`,
          campo: "Matrícula",
          problema: "Matrícula duplicada no arquivo",
        });
        rowHasCriticalError.add(linha);
      }
    }
  }
  for (const [, linhas] of emailSeen) {
    if (linhas.length > 1) {
      for (const linha of linhas) {
        const row = rows.find((r) => r.linha === linha)!;
        errosDetalhados.push({
          linha,
          colaborador: row.nome || `Linha ${linha}`,
          campo: "E-mail corporativo",
          problema: "E-mail duplicado no arquivo",
        });
        rowHasCriticalError.add(linha);
      }
    }
  }

  const emailsInvalidos = errosDetalhados.filter((e) => e.problema === "Formato de e-mail inválido").length;
  const camposObrigatoriosAusentes = errosDetalhados.filter((e) => e.problema === "Campo obrigatório ausente").length;

  errosDetalhados.sort((a, b) => a.linha - b.linha);

  return {
    totalRegistros: rows.length,
    registrosValidos: rows.length - rowHasCriticalError.size,
    erros: rowHasCriticalError.size,
    duplicados,
    emailsInvalidos,
    camposObrigatoriosAusentes,
    errosDetalhados,
    temErroCritico: rowHasCriticalError.size > 0,
  };
}
