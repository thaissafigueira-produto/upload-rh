import * as XLSX from "xlsx";
import type { ParsedRow } from "@/types";

const HEADER_MAP: Record<string, keyof ParsedRow> = {
  nome: "nome",
  "e-mail corporativo": "email",
  "email corporativo": "email",
  email: "email",
  matricula: "matricula",
  "matrícula": "matricula",
  cnpj: "cnpj",
  departamento: "departamento",
  cargo: "cargo",
  status: "status",
};

function normalizeHeader(header: string) {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export class ParseError extends Error {}

export async function parseEmployeeFile(file: File): Promise<ParsedRow[]> {
  const name = file.name.toLowerCase();
  const isCsv = name.endsWith(".csv");
  const isSpreadsheet = name.endsWith(".xlsx") || name.endsWith(".xls");
  if (!isCsv && !isSpreadsheet) {
    throw new ParseError("Formato de arquivo não suportado. Envie um arquivo .xlsx ou .csv.");
  }

  let workbook: XLSX.WorkBook;
  if (isCsv) {
    const text = await file.text();
    workbook = XLSX.read(text, { type: "string" });
  } else {
    const buffer = await file.arrayBuffer();
    workbook = XLSX.read(buffer, { type: "array" });
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

  const required: (keyof ParsedRow)[] = ["nome", "email", "matricula", "cnpj", "departamento", "cargo", "status"];
  const missingColumns = required.filter((key) => columnIndex[key] === undefined);
  if (missingColumns.length > 0) {
    throw new ParseError(
      `O arquivo não segue o modelo esperado. Colunas ausentes: ${missingColumns.join(", ")}.`,
    );
  }

  const parsed: ParsedRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const raw = rows[i];
    if (raw.every((cell) => String(cell).trim() === "")) continue;
    const get = (key: keyof ParsedRow) => String(raw[columnIndex[key]!] ?? "").trim();
    parsed.push({
      linha: i + 1,
      nome: get("nome"),
      email: get("email"),
      matricula: get("matricula"),
      cnpj: get("cnpj"),
      departamento: get("departamento"),
      cargo: get("cargo"),
      status: get("status"),
    });
  }

  return parsed;
}
