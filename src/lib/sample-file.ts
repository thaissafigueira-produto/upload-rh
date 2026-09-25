import * as XLSX from "xlsx";
import { downloadBlob } from "@/lib/csv";
import { isoDateToBR } from "@/lib/dates";
import type { Cnpj, Employee, ModoEnvio } from "@/types";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const HEADERS_CADASTRO = [
  "Nome", "E-mail corporativo", "Matrícula", "CNPJ", "Departamento", "Cargo", "Telefone", "Status", "Data de desligamento",
];
const HEADERS_DESLIGAMENTO = ["Matrícula", "Data de desligamento", "Nome"];

function buildFile(headers: string[], rows: (string | number)[][], filename: string) {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet["!cols"] = headers.map((h) => ({ wch: Math.max(18, h.length + 4) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Colaboradores");
  const array = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new File([array], filename, { type: XLSX_MIME });
}

export function downloadFile(file: File) {
  downloadBlob(file.name, file);
}

export function buildTemplateFile(modo: ModoEnvio, cnpj = "00.000.000/0001-00") {
  if (modo === "desligamentos") {
    return buildFile(
      HEADERS_DESLIGAMENTO,
      [["MAT00123", "15/10/2026", "Ana Silva (opcional)"], ["MAT00124", "20/10/2026", "Bruno Souza (opcional)"]],
      "modelo-desligamentos.xlsx",
    );
  }
  const rows = [
    ["Ana Silva", "ana.silva@suaempresa.com.br", "MAT00123", cnpj, "Tecnologia", "Analista de Sistemas", "(11) 91234-5678", "Ativo", ""],
    ["Bruno Souza", "bruno.souza@suaempresa.com.br", "MAT00124", cnpj, "Financeiro", "Analista Financeiro", "(11) 98765-4321", "Ativo", ""],
  ];
  return buildFile(HEADERS_CADASTRO, rows, modo === "novos" ? "modelo-novos-colaboradores.xlsx" : "modelo-base-colaboradores.xlsx");
}

const statusLabel = (e: Employee) => (e.status === "desligado" ? "Desligado" : "Ativo");

function daysAgoBR(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoDateToBR(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
}

/** Monta um arquivo de exemplo a partir da base atual, para testar cada tipo de envio sem montar uma
 * planilha à mão. Com `withErrors`, inclui alguns erros de validação de propósito. */
export function buildSampleFile(employees: Employee[], cnpjs: Cnpj[], modo: ModoEnvio, withErrors: boolean) {
  const [c1, c2] = cnpjs.filter((c) => c.ativo).map((c) => c.cnpj);
  const ativos = employees.filter((e) => e.status === "ativo");
  const sufixo = withErrors ? "-com-erros" : "";

  if (modo === "desligamentos") {
    const rows: (string | number)[][] = [5, 9, 14].map((i, n) => [ativos[i].matricula, daysAgoBR(3 + n), ativos[i].nome]);
    if (withErrors) {
      rows.push(["MAT-INEXISTENTE", daysAgoBR(2), "Matrícula que não existe"]);
      rows.push([ativos[20].matricula, "", "Sem data de desligamento"]);
      rows.push([ativos[22].matricula, "31/12/2099", "Data no futuro"]);
    }
    return buildFile(HEADERS_DESLIGAMENTO, rows, `exemplo-desligamentos${sufixo}.xlsx`);
  }

  if (modo === "novos") {
    const rows: (string | number)[][] = [
      ["Camila Ferraz", "camila.ferraz@exemplo.com.br", "EX90001", c1, "Comercial", "Executivo(a) de Contas", "(11) 90000-0001", "Ativo", ""],
      ["Diego Nunes", "diego.nunes@exemplo.com.br", "EX90002", c2 ?? c1, "Tecnologia", "Engenheiro(a) de Software", "(11) 90000-0002", "Ativo", ""],
      ["Elisa Prado", "elisa.prado@exemplo.com.br", "EX90003", c1, "RH", "Recrutador(a)", "(11) 90000-0003", "Ativo", ""],
    ];
    if (withErrors) {
      rows.push(["Fabio Lemos", "fabio.lemos", "EX90004", c1, "Financeiro", "Analista Financeiro", "", "Ativo", ""]);
      rows.push(["Gisele Prado", "gisele.prado@exemplo.com.br", ativos[0].matricula, c1, "Marketing", "Designer", "", "Ativo", ""]);
      rows.push(["Heitor Lins", "heitor.lins@exemplo.com.br", "EX90006", "99.999.999/0001-99", "Operações", "Analista de Operações", "", "Ativo", ""]);
    }
    return buildFile(HEADERS_CADASTRO, rows, `exemplo-novos-colaboradores${sufixo}.xlsx`);
  }

  const comAdesao = ativos.filter((e) => e.beneficio === "com_adesao");
  const missing = new Set([...comAdesao.slice(-3), ...ativos.filter((e) => e.beneficio === "sem_adesao").slice(-2)].map((e) => e.id));

  const rows: (string | number)[][] = ativos
    .filter((e) => !missing.has(e.id))
    .map((e, idx) => {
      const base: (string | number)[] = [
        e.nome, e.email, e.matricula, e.cnpj || c1, e.departamento, e.cargo, e.telefone, statusLabel(e), "",
      ];
      if (idx === 3) base[4] = "Marketing";
      if (idx === 8) base[5] = "Coordenador(a)";
      if (idx === 10) base[6] = "(11) 97777-0000";
      if (idx === 12 || idx === 20) base[3] = e.cnpj === c1 ? c2 : c1;
      if (idx === 15) {
        base[7] = "Desligado";
        base[8] = daysAgoBR(4);
      }
      return base;
    });

  rows.push(["Camila Ferraz", "camila.ferraz@exemplo.com.br", "EX90001", c1, "Comercial", "Executivo(a) de Contas", "(11) 90000-0001", "Ativo", ""]);
  rows.push(["Diego Nunes", "diego.nunes@exemplo.com.br", "EX90002", c2 ?? c1, "Tecnologia", "Engenheiro(a) de Software", "(11) 90000-0002", "Ativo", ""]);
  rows.push(["Elisa Prado", "elisa.prado@exemplo.com.br", "EX90003", c1, "RH", "Recrutador(a)", "(11) 90000-0003", "Ativo", ""]);

  if (withErrors) {
    rows.push(["Fabio Lemos", "fabio.lemos-sem-arroba", "EX90004", c1, "Financeiro", "Analista Financeiro", "", "Ativo", ""]);
    rows.push(["Gisele Prado", "gisele.prado@exemplo.com.br", "", c2 ?? c1, "Marketing", "Designer", "", "Ativo", ""]);
    rows.push(["Heitor Lins", "heitor.lins@exemplo.com.br", "EX90006", "99.999.999/0001-99", "Operações", "Analista de Operações", "", "Ativo", ""]);
    rows.push(["Ivana Melo", "ivana.melo@exemplo.com.br", "EX90001", c1, "Comercial", "SDR", "", "Ativo", ""]);
  }

  return buildFile(HEADERS_CADASTRO, rows, `exemplo-base-completa${sufixo}.xlsx`);
}

/** Modelo para a equipe Guapeco atualizar o benefício em massa. */
export function buildBeneficiosTemplate() {
  return buildFile(
    ["Matrícula", "Benefício"],
    [["MAT00123", "Com adesão"], ["MAT00124", "Sem adesão"]],
    "modelo-beneficios.xlsx",
  );
}
