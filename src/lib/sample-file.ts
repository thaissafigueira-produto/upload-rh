import * as XLSX from "xlsx";
import { downloadBlob } from "@/lib/csv";
import type { Cnpj, Employee } from "@/types";

const HEADERS = ["Nome", "E-mail corporativo", "Matrícula", "CNPJ", "Departamento", "Cargo", "Status"];
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function buildFile(rows: (string | number)[][], filename: string) {
  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  sheet["!cols"] = HEADERS.map((h) => ({ wch: Math.max(18, h.length + 4) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Colaboradores");
  const array = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new File([array], filename, { type: XLSX_MIME });
}

export function downloadFile(file: File) {
  downloadBlob(file.name, file);
}

export function buildTemplateFile(cnpj = "00.000.000/0001-00") {
  return buildFile(
    [
      ["Ana Silva", "ana.silva@suaempresa.com.br", "MAT00123", cnpj, "Tecnologia", "Analista de Sistemas", "Ativo"],
      ["Bruno Souza", "bruno.souza@suaempresa.com.br", "MAT00124", cnpj, "Financeiro", "Analista Financeiro", "Ativo"],
    ],
    "modelo-base-colaboradores.xlsx",
  );
}

const statusLabel = (e: Employee) => (e.status === "desligado" ? "Desligado" : "Ativo");

/** Monta uma "próxima versão" da base a partir da atual, com novos, não encontrados, alterados e
 * (opcionalmente) alguns erros de validação — só para testar o fluxo sem montar uma planilha à mão. */
export function buildSampleFile(employees: Employee[], cnpjs: Cnpj[], withErrors: boolean) {
  const [c1, c2] = cnpjs.filter((c) => c.ativo).map((c) => c.cnpj);
  const ativos = employees.filter((e) => e.status === "ativo");
  const comAdesao = ativos.filter((e) => e.beneficio === "com_adesao");
  const missing = new Set([...comAdesao.slice(-3), ...ativos.filter((e) => e.beneficio === "sem_adesao").slice(-2)].map((e) => e.id));

  const rows: (string | number)[][] = ativos
    .filter((e) => !missing.has(e.id))
    .map((e, idx) => {
      const base = [e.nome, e.email, e.matricula, e.cnpj || c1, e.departamento, e.cargo, statusLabel(e)];
      if (idx === 3) base[4] = "Marketing";
      if (idx === 8) base[5] = "Coordenador(a)";
      if (idx === 12 || idx === 20) base[3] = e.cnpj === c1 ? c2 : c1;
      if (idx === 15) base[6] = "Desligado";
      return base;
    });

  rows.push(["Camila Ferraz", "camila.ferraz@venturus.com.br", "VT90001", c1, "Comercial", "Executivo(a) de Contas", "Ativo"]);
  rows.push(["Diego Nunes", "diego.nunes@venturus.com.br", "VT90002", c2, "Tecnologia", "Engenheiro(a) de Software", "Ativo"]);
  rows.push(["Elisa Prado", "elisa.prado@venturus.com.br", "VT90003", c1, "RH", "Recrutador(a)", "Ativo"]);

  if (withErrors) {
    rows.push(["Fabio Lemos", "fabio.lemos-sem-arroba", "VT90004", c1, "Financeiro", "Analista Financeiro", "Ativo"]);
    rows.push(["Gisele Prado", "gisele.prado@venturus.com.br", "", c2, "Marketing", "Designer", "Ativo"]);
    rows.push(["Heitor Lins", "heitor.lins@venturus.com.br", "VT90006", "99.999.999/0001-99", "Operações", "Analista de Operações", "Ativo"]);
    rows.push(["Ivana Melo", "ivana.melo@venturus.com.br", "VT90001", c1, "Comercial", "SDR", "Ativo"]);
  }

  return buildFile(rows, withErrors ? "base-exemplo-com-erros.xlsx" : "base-exemplo.xlsx");
}
