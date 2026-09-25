import { toCsv } from "@/lib/csv";
import { computeDiff, type ComputedDiff } from "@/lib/diff";
import { parseEmployeeFile } from "@/lib/parse-file";
import { validateRows } from "@/lib/validate";
import type { AuditEvent, BaseVersion, ModoEnvio, Upload } from "@/types";
import { auditService } from "./auditService";
import { getContext, makeAuditEvent } from "./authService";
import { getDb, mutate } from "./database";

/** Resultado da análise fica só na memória até o RH confirmar ou cancelar. */
const pendingComputed = new Map<string, ComputedDiff>();

const HISTORY_STATUSES: Upload["status"][] = ["confirmada", "com_erros", "cancelada"];

export interface AnalysisResult {
  upload: Upload;
  linhasIgnoradas: number;
}

export const uploadsService = {
  /** Atualizações que aparecem no histórico, da mais recente para a mais antiga. */
  list(): Upload[] {
    const { empresaId } = getContext();
    return getDb()
      .uploads.filter((u) => u.empresaId === empresaId && HISTORY_STATUSES.includes(u.status))
      .sort((a, b) => b.data.localeCompare(a.data));
  },

  get(id: string): Upload | undefined {
    const { empresaId } = getContext();
    return getDb().uploads.find((u) => u.id === id && u.empresaId === empresaId);
  },

  /** Lê o arquivo no navegador, valida e compara com a base atual. */
  async analyze(file: File, modo: ModoEnvio = "completa"): Promise<AnalysisResult> {
    const ctx = getContext();
    if (ctx.perfil !== "rh") throw new Error("Apenas o RH da empresa pode enviar a base.");
    const { rows, linhasIgnoradas } = await parseEmployeeFile(file, modo);
    const db = getDb();
    const cnpjs = db.cnpjs.filter((c) => c.empresaId === ctx.empresaId && c.ativo);
    const current = db.employees.filter((e) => e.empresaId === ctx.empresaId);
    const base = new Map(current.map((e) => [e.matricula.trim().toLowerCase(), e.status]));
    const validation = validateRows(rows, { cnpjs: cnpjs.map((c) => c.cnpj), modo, base });
    const now = new Date().toISOString();
    const id = `upl-${Date.now()}`;

    const computed = validation.temErroCritico
      ? null
      : computeDiff(current, rows, cnpjs, ctx.empresaId, now, modo);
    const diff = computed?.diff ?? { novos: [], naoEncontrados: [], alterados: [] };

    const upload: Upload = {
      id, empresaId: ctx.empresaId, arquivo: file.name, tamanho: file.size, data: now, usuario: ctx.usuario,
      origem: "upload_manual", modo, status: validation.temErroCritico ? "com_erros" : "validado", validation,
      total: validation.totalRegistros, novos: diff.novos.length, naoEncontrados: diff.naoEncontrados.length,
      alterados: diff.alterados.length, diff,
    };
    if (computed) pendingComputed.set(id, computed);

    mutate((state) => ({
      ...state,
      uploads: [...state.uploads, upload],
      audit: [
        ...state.audit,
        makeAuditEvent(ctx, { data: now, acao: "upload_iniciado", entidadeTipo: "upload", entidadeId: id, entidadeNome: file.name, descricao: `Upload da planilha ${file.name}` }),
        makeAuditEvent(ctx, {
          data: now, acao: "upload_concluido", entidadeTipo: "upload", entidadeId: id, entidadeNome: file.name,
          descricao: `${validation.registrosValidos} de ${validation.totalRegistros} registros válidos`,
        }),
      ],
    }));

    return { upload, linhasIgnoradas };
  },

  cancel(id: string) {
    const ctx = getContext();
    pendingComputed.delete(id);
    mutate((db) => {
      const upload = db.uploads.find((u) => u.id === id && u.empresaId === ctx.empresaId);
      if (!upload || upload.status === "confirmada") return db;
      if (upload.status === "com_erros") return db;
      return {
        ...db,
        uploads: db.uploads.map((u) => (u.id === id ? { ...u, status: "cancelada" as const } : u)),
        audit: [
          ...db.audit,
          makeAuditEvent(ctx, { acao: "upload_cancelado", entidadeTipo: "upload", entidadeId: id, entidadeNome: upload.arquivo, descricao: "Atualização cancelada antes da confirmação" }),
        ],
      };
    });
  },

  /** Cria uma nova versão imutável da base a partir da análise aprovada. */
  confirm(id: string): { upload: Upload; version: BaseVersion } | null {
    const ctx = getContext();
    if (ctx.perfil !== "rh") return null;
    const computed = pendingComputed.get(id);
    const upload = uploadsService.get(id);
    if (!computed || !upload || upload.status !== "validado") return null;

    const now = new Date().toISOString();
    let result: { upload: Upload; version: BaseVersion } | null = null;

    mutate((db) => {
      const numero = Math.max(0, ...db.versions.filter((v) => v.empresaId === ctx.empresaId).map((v) => v.numero)) + 1;
      const versaoId = `ver-${ctx.empresaId}-${numero}`;
      const total = computed.nextEmployees.filter((e) => e.status !== "desligado").length;
      const version: BaseVersion = {
        id: versaoId, empresaId: ctx.empresaId, numero, data: now, usuario: ctx.usuario, arquivo: upload.arquivo,
        origem: upload.origem, uploadId: id, total, colaboradores: JSON.parse(JSON.stringify(computed.nextEmployees)),
      };
      const confirmed: Upload = { ...upload, status: "confirmada", versaoId, total, data: upload.data };

      const events: AuditEvent[] = [
        makeAuditEvent(ctx, { data: now, acao: "atualizacao_confirmada", entidadeTipo: "upload", entidadeId: id, entidadeNome: upload.arquivo, descricao: `Base atualizada — versão ${numero}` }),
      ];
      for (const e of computed.diff.novos) {
        events.push(makeAuditEvent(ctx, { data: now, acao: "colaborador_entrou_na_base", entidadeTipo: "colaborador", entidadeId: e.id, entidadeNome: e.nome, descricao: `${e.nome} entrou na base (versão ${numero})` }));
      }
      for (const e of computed.diff.naoEncontrados) {
        events.push(makeAuditEvent(ctx, {
          data: now, acao: "colaborador_nao_encontrado", entidadeTipo: "colaborador", entidadeId: e.id, entidadeNome: e.nome,
          valorAnterior: "Ativo", valorNovo: "Não encontrado na última base", descricao: `${e.nome} não apareceu na base da versão ${numero}`,
        }));
      }
      for (const change of computed.diff.alterados) {
        if (upload.modo === "desligamentos") {
          const quando = change.mudancas.find((m) => m.campo === "Data de desligamento")?.novo ?? "";
          events.push(makeAuditEvent(ctx, {
            data: now, acao: "colaborador_desligado", entidadeTipo: "colaborador", entidadeId: change.id, entidadeNome: change.nome,
            valorAnterior: change.mudancas.find((m) => m.campo === "Status")?.anterior, valorNovo: `Desligado em ${quando}`,
            descricao: `${change.nome} marcado(a) como desligado(a) na versão ${numero}`,
          }));
          continue;
        }
        for (const m of change.mudancas) {
          events.push(makeAuditEvent(ctx, {
            data: now, acao: m.campo === "CNPJ" ? "cnpj_alterado" : "colaborador_alterado", entidadeTipo: "colaborador",
            entidadeId: change.id, entidadeNome: change.nome, valorAnterior: m.anterior || "—", valorNovo: m.novo || "—",
            descricao: `${m.campo} de ${change.nome} alterado na versão ${numero}`,
          }));
        }
      }

      result = { upload: confirmed, version };
      return {
        ...db,
        employees: [...db.employees.filter((e) => e.empresaId !== ctx.empresaId), ...computed.nextEmployees],
        versions: [...db.versions, version],
        uploads: db.uploads.map((u) => (u.id === id ? confirmed : u)),
        audit: [...db.audit, ...events],
      };
    });

    pendingComputed.delete(id);
    return result;
  },

  /** Lista de erros em CSV, para corrigir a planilha e enviar de novo. */
  exportErrorsCsv(id: string): { filename: string; content: string } | null {
    const upload = uploadsService.get(id);
    if (!upload) return null;
    auditService.recordExport(id, upload.arquivo, `Lista de erros de ${upload.arquivo} exportada em CSV`);
    return {
      filename: `erros-${upload.arquivo.replace(/\.[^.]+$/, "")}.csv`,
      content: toCsv(
        ["Linha", "Colaborador", "Campo", "Problema"],
        upload.validation.errosDetalhados.map((e) => [e.linha, e.colaborador, e.campo, e.problema]),
      ),
    };
  },
};
