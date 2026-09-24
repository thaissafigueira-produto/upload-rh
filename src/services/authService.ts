import { DEMO_USUARIO } from "@/data/seed";
import type { AuditEvent, Empresa, Usuario } from "@/types";
import { getState, resetDatabase, setSessionUserId } from "./database";

export interface ServiceContext {
  empresaId: string;
  usuario: string;
}

/** Contexto do usuário logado. Todos os services filtram por `empresaId`. */
export function getContext(): ServiceContext {
  const { db, sessionUserId } = getState();
  const user = db.usuarios.find((u) => u.id === sessionUserId);
  return { empresaId: user?.empresaId ?? "", usuario: user?.nome ?? "" };
}

let auditSeq = 0;

export function makeAuditEvent(
  ctx: ServiceContext,
  ev: Omit<AuditEvent, "id" | "empresaId" | "usuario" | "data"> & { data?: string },
): AuditEvent {
  auditSeq += 1;
  return {
    id: `aud-${Date.now()}-${auditSeq}`,
    empresaId: ctx.empresaId,
    usuario: ctx.usuario,
    data: ev.data ?? new Date().toISOString(),
    ...ev,
  };
}

export const authService = {
  /** Login simulado: entra direto com a usuária de demonstração. */
  login(): Usuario {
    setSessionUserId(DEMO_USUARIO.id);
    return DEMO_USUARIO;
  },
  logout() {
    setSessionUserId(null);
  },
  currentUser(): Usuario | null {
    const { db, sessionUserId } = getState();
    return db.usuarios.find((u) => u.id === sessionUserId) ?? null;
  },
  isAuthenticated() {
    return authService.currentUser() !== null;
  },
  currentEmpresa(): Empresa | null {
    const user = authService.currentUser();
    return getState().db.empresas.find((e) => e.id === user?.empresaId) ?? null;
  },
  /** Volta tudo ao estado inicial de demonstração (mantém o login). */
  restoreDemoData() {
    resetDatabase();
  },
};
