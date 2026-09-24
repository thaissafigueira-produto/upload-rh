import type { AuditEvent } from "@/types";
import { getContext, makeAuditEvent } from "./authService";
import { getDb, mutate } from "./database";

export const auditService = {
  forEmployee(employeeId: string): AuditEvent[] {
    const { empresaId } = getContext();
    return getDb()
      .audit.filter((e) => e.empresaId === empresaId && e.entidadeTipo === "colaborador" && e.entidadeId === employeeId)
      .sort((a, b) => b.data.localeCompare(a.data));
  },

  forUpload(uploadId: string): AuditEvent[] {
    const { empresaId } = getContext();
    return getDb()
      .audit.filter((e) => e.empresaId === empresaId && e.entidadeTipo === "upload" && e.entidadeId === uploadId)
      .sort((a, b) => a.data.localeCompare(b.data));
  },

  recordExport(entidadeId: string, entidadeNome: string, descricao: string) {
    const ctx = getContext();
    mutate((db) => ({
      ...db,
      audit: [...db.audit, makeAuditEvent(ctx, { acao: "exportacao", entidadeTipo: "exportacao", entidadeId, entidadeNome, descricao })],
    }));
  },
};
