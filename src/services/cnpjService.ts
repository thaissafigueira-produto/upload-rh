import { toCsv } from "@/lib/csv";
import { formatCompetencia } from "@/lib/format";
import type { Cnpj, ConferenciaCnpj, EmployeeStatus, VinculoCnpj } from "@/types";
import { auditService } from "./auditService";
import { getContext, makeAuditEvent } from "./authService";
import { getDb, mutate } from "./database";

export type AlertaConferencia = "sem_cnpj" | "cnpj_alterado" | "nao_encontrado";

export interface LinhaConferencia {
  employeeId: string;
  nome: string;
  matricula: string;
  departamento: string;
  cnpj: string;
  cnpjAnterior?: string;
  status: EmployeeStatus;
  alertas: AlertaConferencia[];
}

export interface ConferenciaView {
  conferencia: ConferenciaCnpj;
  somenteLeitura: boolean;
  linhas: LinhaConferencia[];
  porCnpj: { cnpj: string; razaoSocial: string; quantidade: number }[];
  totais: { semCnpj: number; cnpjAlterado: number; naoEncontrado: number };
}

export interface CnpjResumo extends Cnpj {
  colaboradores: number;
  comAdesao: number;
}

function proximaCompetencia(competencia: string) {
  const [ano, mes] = competencia.split("-").map(Number);
  return mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

export const cnpjService = {
  list(): Cnpj[] {
    const { empresaId } = getContext();
    return getDb().cnpjs.filter((c) => c.empresaId === empresaId);
  },

  listAtivos(): Cnpj[] {
    return cnpjService.list().filter((c) => c.ativo);
  },

  listComContagem(): CnpjResumo[] {
    const { empresaId } = getContext();
    const employees = getDb().employees.filter((e) => e.empresaId === empresaId && e.status !== "desligado");
    return cnpjService.list().map((c) => {
      const doCnpj = employees.filter((e) => e.cnpj === c.cnpj);
      return { ...c, colaboradores: doCnpj.length, comAdesao: doCnpj.filter((e) => e.beneficio === "com_adesao").length };
    });
  },

  listConferencias(): ConferenciaCnpj[] {
    const { empresaId } = getContext();
    return getDb()
      .conferencias.filter((c) => c.empresaId === empresaId)
      .sort((a, b) => b.competencia.localeCompare(a.competencia));
  },

  getConferencia(id: string): ConferenciaCnpj | undefined {
    return cnpjService.listConferencias().find((c) => c.id === id);
  },

  /** Conferências que ainda precisam ser confirmadas (usado no selo da barra lateral). */
  pendingCount(): number {
    return cnpjService.listConferencias().filter((c) => c.status !== "confirmada").length;
  },

  getView(id: string): ConferenciaView | null {
    const conferencia = cnpjService.getConferencia(id);
    if (!conferencia) return null;
    const { empresaId } = getContext();
    const db = getDb();
    const cnpjs = cnpjService.list();
    const employees = db.employees.filter((e) => e.empresaId === empresaId);

    let linhas: LinhaConferencia[];
    const somenteLeitura = conferencia.status === "confirmada";

    if (somenteLeitura) {
      const byId = new Map(employees.map((e) => [e.id, e]));
      linhas = (conferencia.vinculos ?? []).map((v: VinculoCnpj) => ({
        employeeId: v.employeeId,
        nome: v.nome,
        matricula: v.matricula,
        departamento: byId.get(v.employeeId)?.departamento ?? "",
        cnpj: v.cnpj,
        status: byId.get(v.employeeId)?.status ?? "ativo",
        alertas: [],
      }));
    } else {
      const anterior = cnpjService
        .listConferencias()
        .find((c) => c.status === "confirmada" && c.competencia < conferencia.competencia);
      const baseline = new Map((anterior?.vinculos ?? []).map((v) => [v.employeeId, v.cnpj]));
      linhas = employees
        .filter((e) => e.beneficio === "com_adesao" && e.status !== "desligado")
        .map((e) => {
          const alertas: AlertaConferencia[] = [];
          const cnpjAnterior = baseline.get(e.id);
          if (!e.cnpj) alertas.push("sem_cnpj");
          else if (cnpjAnterior && cnpjAnterior !== e.cnpj) alertas.push("cnpj_alterado");
          if (e.status === "nao_encontrado") alertas.push("nao_encontrado");
          return {
            employeeId: e.id, nome: e.nome, matricula: e.matricula, departamento: e.departamento,
            cnpj: e.cnpj, cnpjAnterior: alertas.includes("cnpj_alterado") ? cnpjAnterior : undefined,
            status: e.status, alertas,
          };
        })
        .sort((a, b) => b.alertas.length - a.alertas.length || a.nome.localeCompare(b.nome));
    }

    return {
      conferencia,
      somenteLeitura,
      linhas,
      porCnpj: cnpjs.map((c) => ({
        cnpj: c.cnpj, razaoSocial: c.razaoSocial, quantidade: linhas.filter((l) => l.cnpj === c.cnpj).length,
      })),
      totais: {
        semCnpj: linhas.filter((l) => l.alertas.includes("sem_cnpj")).length,
        cnpjAlterado: linhas.filter((l) => l.alertas.includes("cnpj_alterado")).length,
        naoEncontrado: linhas.filter((l) => l.alertas.includes("nao_encontrado")).length,
      },
    };
  },

  confirmar(id: string): { ok: true } | { ok: false; motivo: string } {
    const view = cnpjService.getView(id);
    if (!view || view.somenteLeitura) return { ok: false, motivo: "Esta conferência já foi confirmada." };
    if (view.totais.semCnpj > 0) {
      return {
        ok: false,
        motivo: `Ainda há ${view.totais.semCnpj} colaborador(es) com adesão sem CNPJ definido. Defina o CNPJ de cada um para confirmar.`,
      };
    }
    const ctx = getContext();
    const now = new Date().toISOString();
    const vinculos: VinculoCnpj[] = view.linhas.map((l) => ({
      employeeId: l.employeeId, nome: l.nome, matricula: l.matricula, cnpj: l.cnpj,
    }));
    mutate((db) => {
      const empresa = db.empresas.find((e) => e.id === ctx.empresaId);
      const next = proximaCompetencia(view.conferencia.competencia);
      const [ano, mes] = next.split("-").map(Number);
      const jaExiste = db.conferencias.some((c) => c.empresaId === ctx.empresaId && c.competencia === next);
      const conferencias: ConferenciaCnpj[] = db.conferencias.map((c) =>
        c.id === id ? { ...c, status: "confirmada" as const, confirmadoPor: ctx.usuario, confirmadoEm: now, vinculos } : c,
      );
      if (!jaExiste) {
        conferencias.push({
          id: `conf-${next}`, empresaId: ctx.empresaId, competencia: next, status: "pendente",
          prazo: new Date(ano, mes - 1, empresa?.diaPrazoConferencia ?? 10, 23, 59).toISOString(),
        });
      }
      return {
        ...db,
        conferencias,
        audit: [
          ...db.audit,
          makeAuditEvent(ctx, {
            acao: "conferencia_confirmada", entidadeTipo: "conferencia", entidadeId: id,
            entidadeNome: `Conferência ${formatCompetencia(view.conferencia.competencia)}`,
            descricao: `Conferência de CNPJs de ${formatCompetencia(view.conferencia.competencia)} confirmada`,
          }),
        ],
      };
    });
    return { ok: true };
  },

  /** Resumo em CSV com os colaboradores de cada CNPJ, para o financeiro da Guapeco. */
  exportResumoCsv(id: string): { filename: string; content: string } | null {
    const view = cnpjService.getView(id);
    if (!view) return null;
    const cnpjs = cnpjService.list();
    const rows = view.linhas
      .slice()
      .sort((a, b) => a.cnpj.localeCompare(b.cnpj) || a.nome.localeCompare(b.nome))
      .map((l) => [
        l.cnpj || "Sem CNPJ",
        cnpjs.find((c) => c.cnpj === l.cnpj)?.razaoSocial ?? "",
        l.nome, l.matricula, l.departamento,
      ]);
    const competencia = view.conferencia.competencia;
    auditService.recordExport(id, `Resumo ${formatCompetencia(competencia)}`, `Resumo da conferência de ${formatCompetencia(competencia)} exportado em CSV`);
    return {
      filename: `conferencia-cnpjs-${competencia}.csv`,
      content: toCsv(["CNPJ", "Razão social", "Colaborador", "Matrícula", "Departamento"], rows),
    };
  },
};
