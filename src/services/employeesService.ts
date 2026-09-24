import type { AuditEvent, ConferenciaCnpj, Database, Employee } from "@/types";
import { getContext, makeAuditEvent } from "./authService";
import { getDb, mutate } from "./database";

function startConferenciaIfPending(conferencias: ConferenciaCnpj[], empresaId: string): ConferenciaCnpj[] {
  return conferencias.map((c) =>
    c.empresaId === empresaId && c.status === "pendente" ? { ...c, status: "em_conferencia" as const } : c,
  );
}

function applyCnpj(db: Database, ids: string[], cnpj: string, acao: "cnpj_alterado" | "cnpj_alterado_em_massa") {
  const ctx = getContext();
  const now = new Date().toISOString();
  const events: AuditEvent[] = [];
  const employees = db.employees.map((e) => {
    if (e.empresaId !== ctx.empresaId || !ids.includes(e.id) || e.cnpj === cnpj) return e;
    events.push(
      makeAuditEvent(ctx, {
        acao, entidadeTipo: "colaborador", entidadeId: e.id, entidadeNome: e.nome,
        valorAnterior: e.cnpj || "Sem CNPJ", valorNovo: cnpj,
        descricao: `CNPJ de ${e.nome} alterado`,
      }),
    );
    return { ...e, cnpj, dataAtualizacao: now };
  });
  if (events.length === 0) return db;
  return {
    ...db,
    employees,
    conferencias: startConferenciaIfPending(db.conferencias, ctx.empresaId),
    audit: [...db.audit, ...events],
  };
}

export const employeesService = {
  list(): Employee[] {
    const { empresaId } = getContext();
    return getDb().employees.filter((e) => e.empresaId === empresaId);
  },

  get(id: string): Employee | undefined {
    return employeesService.list().find((e) => e.id === id);
  },

  departamentos(): string[] {
    return [...new Set(employeesService.list().map((e) => e.departamento).filter(Boolean))].sort();
  },

  /** Colaboradores que ainda fazem parte da base (não desligados). */
  countNaBase(): number {
    return employeesService.list().filter((e) => e.status !== "desligado").length;
  },

  countNaoEncontrados(): number {
    return employeesService.list().filter((e) => e.status === "nao_encontrado").length;
  },

  /** `dataDesligamento` no formato AAAA-MM-DD. */
  markAsDesligado(id: string, dataDesligamento: string) {
    const ctx = getContext();
    const when = new Date(`${dataDesligamento}T12:00:00`).toISOString();
    mutate((db) => {
      const target = db.employees.find((e) => e.id === id && e.empresaId === ctx.empresaId);
      if (!target || target.status === "desligado") return db;
      return {
        ...db,
        employees: db.employees.map((e) =>
          e.id === id ? { ...e, status: "desligado" as const, dataDesligamento: when, dataAtualizacao: new Date().toISOString() } : e,
        ),
        audit: [
          ...db.audit,
          makeAuditEvent(ctx, {
            acao: "colaborador_desligado", entidadeTipo: "colaborador", entidadeId: id, entidadeNome: target.nome,
            valorAnterior: target.status === "nao_encontrado" ? "Não encontrado na última base" : "Ativo",
            valorNovo: `Desligado em ${dataDesligamento.split("-").reverse().join("/")}`,
            descricao: `${target.nome} marcado(a) como desligado(a)`,
          }),
        ],
      };
    });
  },

  updateCnpj(id: string, cnpj: string) {
    mutate((db) => applyCnpj(db, [id], cnpj, "cnpj_alterado"));
  },

  bulkUpdateCnpj(ids: string[], cnpj: string) {
    mutate((db) => applyCnpj(db, ids, cnpj, "cnpj_alterado_em_massa"));
  },
};
