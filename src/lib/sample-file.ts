import * as XLSX from "xlsx";
import type { Employee } from "@/types";

const HEADERS = ["Nome", "E-mail corporativo", "Matrícula", "CNPJ", "Departamento", "Cargo", "Status"];

function buildWorkbook(rows: (string | number)[][]) {
  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  sheet["!cols"] = HEADERS.map((h) => ({ wch: Math.max(18, h.length + 4) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Colaboradores");
  return workbook;
}

function downloadWorkbook(workbook: XLSX.WorkBook, filename: string) {
  const array = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadTemplate() {
  const rows = [
    ["Ana Silva", "ana.silva@suaempresa.com.br", "MAT00123", "00.000.000/0001-00", "Tecnologia", "Analista de Sistemas", "Ativo"],
    ["Bruno Souza", "bruno.souza@suaempresa.com.br", "MAT00124", "00.000.000/0001-00", "Financeiro", "Analista Financeiro", "Ativo"],
  ];
  downloadWorkbook(buildWorkbook(rows), "modelo-base-colaboradores.xlsx");
}

function statusLabel(employee: Employee) {
  return employee.status === "ativo" ? "Ativo" : "Desligado";
}

/** Builds a realistic "next version" spreadsheet from the current base, with a few
 * intentional additions, removals and field changes — purely to let a reviewer try the
 * upload → validation → comparison flow without authoring a spreadsheet by hand. */
export function buildSampleNextVersionFile(currentEmployees: Employee[]): File {
  const active = currentEmployees.filter((e) => e.status === "ativo" && !e.naoEncontradoNaUltimaBase);
  const rows: (string | number)[][] = active
    .slice(0, active.length - 2) // drop 2 → shows up as "removidos"
    .map((e, idx) => {
      if (idx === 3) return [e.nome, e.email, e.matricula, e.cnpj, "Marketing", e.cargo, statusLabel(e)];
      if (idx === 8) return [e.nome, e.email, e.matricula, e.cnpj, e.departamento, "Coordenador(a)", statusLabel(e)];
      return [e.nome, e.email, e.matricula, e.cnpj, e.departamento, e.cargo, statusLabel(e)];
    });
  rows.push(["Camila Ferraz", "camila.ferraz@venturus.com.br", "VT90001", "12.345.678/0001-01", "Comercial", "Executivo(a) de Contas", "Ativo"]);
  rows.push(["Diego Nunes", "diego.nunes@venturus.com.br", "VT90002", "12.345.678/0002-82", "Tecnologia", "Engenheiro(a) de Software", "Ativo"]);

  const workbook = buildWorkbook(rows);
  const array = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new File([array], "base-colaboradores-exemplo.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
