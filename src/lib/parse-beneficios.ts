import * as XLSX from "xlsx";
import type { BenefitStatus } from "@/types";

export interface BeneficioRow {
  linha: number;
  matricula: string;
  beneficio: BenefitStatus | null;
  valorOriginal: string;
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

export function parseBeneficio(value: string): BenefitStatus | null {
  const v = normalize(value);
  if (["com adesao", "sim", "s", "1", "aderiu", "com"].includes(v)) return "com_adesao";
  if (["sem adesao", "nao", "n", "0", "sem"].includes(v)) return "sem_adesao";
  return null;
}

/** Lê a planilha da Guapeco com as colunas Matrícula e Benefício. */
export async function parseBeneficiosFile(file: File): Promise<BeneficioRow[]> {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
    throw new Error("Formato não suportado. Envie um arquivo .xlsx ou .csv.");
  }
  const workbook = name.endsWith(".csv")
    ? XLSX.read(await file.text(), { type: "string" })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = sheet ? XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" }) : [];
  if (rows.length === 0) throw new Error("O arquivo está vazio.");

  const header = rows[0].map((h) => normalize(String(h)));
  const matriculaIdx = header.indexOf("matricula");
  const beneficioIdx = header.findIndex((h) => h === "beneficio" || h === "adesao");
  if (matriculaIdx === -1 || beneficioIdx === -1) {
    throw new Error("O arquivo precisa ter as colunas Matrícula e Benefício. Baixe o modelo para conferir.");
  }

  return rows
    .slice(1)
    .filter((r) => r.some((c) => String(c).trim() !== ""))
    .map((r, i) => ({
      linha: i + 2,
      matricula: String(r[matriculaIdx] ?? "").trim(),
      valorOriginal: String(r[beneficioIdx] ?? "").trim(),
      beneficio: parseBeneficio(String(r[beneficioIdx] ?? "")),
    }));
}
