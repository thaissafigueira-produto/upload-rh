import * as XLSX from "xlsx";
import { normalizeDate } from "@/lib/dates";
import type { ModoEnvio, ParsedRow } from "@/types";

const HEADER_MAP: Record<string, keyof ParsedRow> = {
  nome: "nome",
  "e-mail corporativo": "email",
  "email corporativo": "email",
  email: "email",
  matricula: "matricula",
  cnpj: "cnpj",
  departamento: "departamento",
  setor: "departamento",
  cargo: "cargo",
  telefone: "telefone",
  status: "status",
  "data de desligamento": "dataDesligamento",
  "data desligamento": "dataDesligamento",
  desligamento: "dataDesligamento",
};

const REQUIRED_BY_MODE: Record<ModoEnvio, { key: keyof ParsedRow; label: string }[]> = {
  completa: [
    { key: "nome", label: "Nome" },
    { key: "email", label: "E-mail corporativo" },
    { key: "matricula", label: "Matrícula" },
    { key: "cnpj", label: "CNPJ" },
  ],
  novos: [
    { key: "nome", label: "Nome" },
    { key: "email", label: "E-mail corporativo" },
    { key: "matricula", label: "Matrícula" },
    { key: "cnpj", label: "CNPJ" },
  ],
  desligamentos: [
    { key: "matricula", label: "Matrícula" },
    { key: "dataDesligamento", label: "Data de desligamento" },
  ],
};

const CONTENT_FIELDS: (keyof ParsedRow)[] = [
  "nome", "email", "matricula", "cnpj", "departamento", "cargo", "telefone", "status", "dataDesligamento",
];

function normalizeHeader(header: string) {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export class ParseError extends Error {}

export interface ParseResult {
  rows: ParsedRow[];
  /** Linhas com pouco conteúdo: provável anotação ou separador, não um colaborador. */
  linhasIgnoradas: number;
}

export async function parseEmployeeFile(file: File, modo: ModoEnvio = "completa"): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  const isCsv = name.endsWith(".csv");
  const isSpreadsheet = name.endsWith(".xlsx") || name.endsWith(".xls");
  if (!isCsv && !isSpreadsheet) {
    throw new ParseError("Formato de arquivo não suportado. Envie um arquivo .xlsx ou .csv.");
  }

  let workbook: XLSX.WorkBook;
  try {
    if (isCsv) {
      const text = await file.text();
      workbook = XLSX.read(text, { type: "string" });
    } else {
      const buffer = await file.arrayBuffer();
      workbook = XLSX.read(buffer, { type: "array" });
    }
  } catch {
    throw new ParseError("Não foi possível abrir esse arquivo. Confira se ele não está corrompido e tente novamente.");
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    throw new ParseError("Não foi possível ler nenhuma planilha nesse arquivo.");
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
  if (rows.length === 0) {
    throw new ParseError("O arquivo está vazio.");
  }

  const headerRow = rows[0].map((h) => normalizeHeader(String(h)));
  const columnIndex: Partial<Record<keyof ParsedRow, number>> = {};
  headerRow.forEach((header, idx) => {
    const mapped = HEADER_MAP[header];
    if (mapped && columnIndex[mapped] === undefined) columnIndex[mapped] = idx;
  });

  const missing = REQUIRED_BY_MODE[modo].filter((field) => columnIndex[field.key] === undefined).map((field) => field.label);
  if (missing.length > 0) {
    throw new ParseError(
      `O arquivo não segue o modelo esperado. Colunas ausentes: ${missing.join(", ")}. Baixe o modelo para conferir.`,
    );
  }

  // Na lista de desligamentos uma linha só com a matrícula ainda é uma linha de dados (falta a data).
  const minFilled = modo === "desligamentos" ? 1 : 2;

  const parsed: ParsedRow[] = [];
  let linhasIgnoradas = 0;
  for (let i = 1; i < rows.length; i++) {
    const raw = rows[i];
    if (raw.every((cell) => String(cell).trim() === "")) continue;
    const get = (key: keyof ParsedRow) => {
      const idx = columnIndex[key];
      return idx === undefined ? "" : String(raw[idx] ?? "").trim();
    };
    const dataRaw = get("dataDesligamento");
    const row: ParsedRow = {
      linha: i + 1,
      nome: get("nome"),
      email: get("email"),
      matricula: get("matricula"),
      cnpj: get("cnpj"),
      departamento: get("departamento"),
      cargo: get("cargo"),
      telefone: get("telefone"),
      status: get("status"),
      dataDesligamento: normalizeDate(dataRaw) ?? dataRaw,
    };

    if (CONTENT_FIELDS.filter((key) => row[key]).length < minFilled) {
      linhasIgnoradas += 1;
      continue;
    }
    parsed.push(row);
  }

  return { rows: parsed, linhasIgnoradas };
}
