import { toCsv } from "@/lib/csv";
import { isoDateToBR, isoDateToNoon } from "@/lib/dates";
import { parseBeneficiosFile } from "@/lib/parse-beneficios";
import type { AuditAction, AuditEvent, BenefitStatus, ConferenciaCnpj, Database, Employee } from "@/types";
import { auditService } from "./auditService";
import { getContext, makeAuditEvent, type ServiceContext } from "./authService";
import { getDb, mutate } from "./database";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BENEFICIO_LABEL: Record<BenefitStatus, string> = { com_adesao: "Com adesão", sem_adesao: "Sem adesão" };

export interface EmployeeDataPatch {
  nome: string;
  email: string;
  matricula: string;
  departamento: string;
  cargo: string;
  telefone: string;
}

export interface BeneficioAnalysis {
  aplicaveis: { employee: Employee; beneficio: BenefitStatus }[];
  semMudanca: number;
  erros: { linha: number; matricula: string; problema: string }[];
}

function startConferenciaIfPending(conferencias: ConferenciaCnpj[], empresaId: string): ConferenciaCnpj[] {
  return conferencias.map((c) =>
    c.empresaId === empresaId && c.status === "pendente" ? { ...c, status: "em_conferencia" as const } : c,
  );
}

/** Aplica uma mudança a vários colaboradores da empresa e registra um evento por colaborador alterado. */
function updateMany(
  db: Database,
  ctx: ServiceContext,
  ids: string[],
  change: (e: Employee) => { next: Employee; event: Omit<Parameters<typeof makeAuditEvent>[1], "entidadeTipo" | "entidadeId" | "entidadeNome"> } | null,
  options: { touchConferencia?: boolean } = {},
): Database {
  const now = new Date().toISOString();
  const events: AuditEvent[] = [];
  const employees = db.employees.map((e) => {
    if (e.empresaId !== ctx.empresaId || !ids.includes(e.id)) return e;
    const result = change(e);
    if (!result) return e;
    events.push(makeAuditEvent(ctx, { ...result.event, entidadeTipo: "colaborador", entidadeId: e.id, entidadeNome: e.nome }));
    return { ...result.next, dataAtualizacao: now };
  });
  if (events.length === 0) return db;
  return {
    ...db,
    employees,
    conferencias: options.touchConferencia ? startConferenciaIfPending(db.conferencias, ctx.empresaId) : db.conferencias,
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

  // ---------- Ações do RH ----------

  updateData(id: string, patch: EmployeeDataPatch): { ok: true } | { ok: false; motivo: string } {
    const ctx = getContext();
    if (ctx.perfil !== "rh") return { ok: false, motivo: "Apenas o RH da empresa pode editar dados cadastrais." };
    const clean = {
      nome: patch.nome.trim(), email: patch.email.trim(), matricula: patch.matricula.trim(),
      departamento: patch.departamento.trim(), cargo: patch.cargo.trim(), telefone: patch.telefone.trim(),
    };
    if (!clean.nome) return { ok: false, motivo: "Informe o nome do colaborador." };
    if (!clean.matricula) return { ok: false, motivo: "Informe a matrícula do colaborador." };
    if (!EMAIL_REGEX.test(clean.email)) return { ok: false, motivo: "O e-mail não está em um formato válido." };

    const others = employeesService.list().filter((e) => e.id !== id);
    if (others.some((e) => e.matricula.toLowerCase() === clean.matricula.toLowerCase())) {
      return { ok: false, motivo: "Já existe outro colaborador com essa matrícula." };
    }
    if (others.some((e) => e.email.toLowerCase() === clean.email.toLowerCase())) {
      return { ok: false, motivo: "Já existe outro colaborador com esse e-mail." };
    }

    const labels: [keyof EmployeeDataPatch, string][] = [
      ["nome", "Nome"], ["email", "E-mail corporativo"], ["matricula", "Matrícula"],
      ["departamento", "Departamento"], ["cargo", "Cargo"], ["telefone", "Telefone"],
    ];
    mutate((db) => {
      const target = db.employees.find((e) => e.id === id && e.empresaId === ctx.empresaId);
      if (!target) return db;
      const events = labels
        .filter(([key]) => target[key] !== clean[key])
        .map(([key, label]) =>
          makeAuditEvent(ctx, {
            acao: "colaborador_alterado", entidadeTipo: "colaborador", entidadeId: id, entidadeNome: clean.nome,
            valorAnterior: target[key] || "—", valorNovo: clean[key] || "—", descricao: `${label} de ${clean.nome} alterado`,
          }),
        );
      if (events.length === 0) return db;
      return {
        ...db,
        employees: db.employees.map((e) => (e.id === id ? { ...e, ...clean, dataAtualizacao: new Date().toISOString() } : e)),
        audit: [...db.audit, ...events],
      };
    });
    return { ok: true };
  },

  /** `dataDesligamento` no formato AAAA-MM-DD. */
  markAsDesligado(id: string, dataDesligamento: string) {
    employeesService.bulkMarkAsDesligado([id], dataDesligamento);
  },

  bulkMarkAsDesligado(ids: string[], dataDesligamento: string) {
    const ctx = getContext();
    if (ctx.perfil !== "rh") return;
    const when = isoDateToNoon(dataDesligamento);
    mutate((db) =>
      updateMany(db, ctx, ids, (e) =>
        e.status === "desligado"
          ? null
          : {
              next: { ...e, status: "desligado", dataDesligamento: when },
              event: {
                acao: "colaborador_desligado",
                valorAnterior: e.status === "nao_encontrado" ? "Não encontrado na última base" : "Ativo",
                valorNovo: `Desligado em ${isoDateToBR(dataDesligamento)}`,
                descricao: `${e.nome} marcado(a) como desligado(a)`,
              },
            },
      ),
    );
  },

  reactivate(id: string) {
    const ctx = getContext();
    if (ctx.perfil !== "rh") return;
    mutate((db) =>
      updateMany(db, ctx, [id], (e) =>
        e.status !== "desligado"
          ? null
          : {
              next: { ...e, status: "ativo", dataDesligamento: undefined },
              event: {
                acao: "colaborador_reativado", valorAnterior: "Desligado", valorNovo: "Ativo",
                descricao: `${e.nome} voltou a ficar ativo(a)`,
              },
            },
      ),
    );
  },

  updateCnpj(id: string, cnpj: string) {
    employeesService.bulkUpdateCnpj([id], cnpj, "cnpj_alterado");
  },

  bulkUpdateCnpj(ids: string[], cnpj: string, acao: AuditAction = "cnpj_alterado_em_massa") {
    const ctx = getContext();
    if (ctx.perfil !== "rh") return;
    mutate((db) =>
      updateMany(
        db, ctx, ids,
        (e) =>
          e.cnpj === cnpj
            ? null
            : {
                next: { ...e, cnpj },
                event: { acao, valorAnterior: e.cnpj || "Sem CNPJ", valorNovo: cnpj, descricao: `CNPJ de ${e.nome} alterado` },
              },
        { touchConferencia: true },
      ),
    );
  },

  bulkUpdateDepartamento(ids: string[], departamento: string) {
    const ctx = getContext();
    if (ctx.perfil !== "rh") return;
    mutate((db) =>
      updateMany(db, ctx, ids, (e) =>
        e.departamento === departamento
          ? null
          : {
              next: { ...e, departamento },
              event: {
                acao: "colaborador_alterado", valorAnterior: e.departamento || "—", valorNovo: departamento,
                descricao: `Departamento de ${e.nome} alterado`,
              },
            },
      ),
    );
  },

  // ---------- Ações da equipe Guapeco ----------

  updateBeneficio(id: string, beneficio: BenefitStatus) {
    employeesService.bulkUpdateBeneficio([id], beneficio, "beneficio_alterado");
  },

  bulkUpdateBeneficio(ids: string[], beneficio: BenefitStatus, acao: AuditAction = "beneficio_alterado_em_massa") {
    const ctx = getContext();
    if (ctx.perfil !== "guapeco") return;
    mutate((db) =>
      updateMany(
        db, ctx, ids,
        (e) =>
          e.beneficio === beneficio
            ? null
            : {
                next: { ...e, beneficio },
                event: {
                  acao, valorAnterior: BENEFICIO_LABEL[e.beneficio], valorNovo: BENEFICIO_LABEL[beneficio],
                  descricao: `Benefício de ${e.nome} alterado`,
                },
              },
      ),
    );
  },

  /** Lê a planilha de benefícios (Matrícula + Benefício) e diz o que seria alterado, sem aplicar. */
  async analyzeBeneficios(file: File): Promise<BeneficioAnalysis> {
    const rows = await parseBeneficiosFile(file);
    const byMatricula = new Map(employeesService.list().map((e) => [e.matricula.trim().toLowerCase(), e]));
    const analysis: BeneficioAnalysis = { aplicaveis: [], semMudanca: 0, erros: [] };
    for (const row of rows) {
      const employee = byMatricula.get(row.matricula.toLowerCase());
      if (!row.matricula) analysis.erros.push({ linha: row.linha, matricula: "", problema: "Matrícula não preenchida" });
      else if (!employee) analysis.erros.push({ linha: row.linha, matricula: row.matricula, problema: "Matrícula não encontrada na base da empresa" });
      else if (!row.beneficio) analysis.erros.push({ linha: row.linha, matricula: row.matricula, problema: `Benefício não reconhecido: "${row.valorOriginal}". Use "Com adesão" ou "Sem adesão"` });
      else if (employee.beneficio === row.beneficio) analysis.semMudanca += 1;
      else analysis.aplicaveis.push({ employee, beneficio: row.beneficio });
    }
    return analysis;
  },

  applyBeneficios(changes: BeneficioAnalysis["aplicaveis"]) {
    for (const beneficio of ["com_adesao", "sem_adesao"] as BenefitStatus[]) {
      const ids = changes.filter((c) => c.beneficio === beneficio).map((c) => c.employee.id);
      if (ids.length > 0) employeesService.bulkUpdateBeneficio(ids, beneficio);
    }
  },

  /** Base completa da empresa em CSV (para a Guapeco). */
  exportBaseCsv(): { filename: string; content: string } | null {
    const ctx = getContext();
    const db = getDb();
    const empresa = db.empresas.find((e) => e.id === ctx.empresaId);
    if (!empresa) return null;
    const cnpjs = db.cnpjs.filter((c) => c.empresaId === ctx.empresaId);
    const rows = employeesService.list().sort((a, b) => a.nome.localeCompare(b.nome)).map((e) => [
      e.nome, e.email, e.matricula, e.cnpj || "Sem CNPJ", cnpjs.find((c) => c.cnpj === e.cnpj)?.razaoSocial ?? "",
      e.departamento, e.cargo, e.telefone,
      e.status === "ativo" ? "Ativo" : e.status === "desligado" ? "Desligado" : "Não encontrado na última base",
      e.dataDesligamento ? isoDateToBR(e.dataDesligamento.slice(0, 10)) : "", BENEFICIO_LABEL[e.beneficio],
    ]);
    auditService.recordExport(ctx.empresaId, `Base de ${empresa.nome}`, `Base de colaboradores de ${empresa.nome} exportada em CSV`);
    return {
      filename: `base-${empresa.nome.toLowerCase().replace(/\s+/g, "-")}.csv`,
      content: toCsv(
        ["Nome", "E-mail corporativo", "Matrícula", "CNPJ", "Razão social", "Departamento", "Cargo", "Telefone", "Status", "Data de desligamento", "Benefício"],
        rows,
      ),
    };
  },
};
