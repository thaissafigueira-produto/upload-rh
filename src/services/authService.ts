import { DEMO_USUARIO, GUAPECO_USUARIO } from "@/data/seed";
import type { AuditEvent, Empresa, PerfilUsuario, Usuario } from "@/types";
import { getFocusEmpresaId, getState, resetDatabase, setSessionUserId } from "./database";

export interface ServiceContext {
  /** Empresa dos dados. Para a equipe Guapeco, é a empresa aberta no momento. */
  empresaId: string;
  usuario: string;
  perfil: PerfilUsuario | null;
}

/** Contexto do usuário logado. Todos os services filtram por `empresaId`. */
export function getContext(): ServiceContext {
  const { db, sessionUserId } = getState();
  const user = db.usuarios.find((u) => u.id === sessionUserId);
  if (!user) return { empresaId: "", usuario: "", perfil: null };
  if (user.perfil === "guapeco") {
    return { empresaId: getFocusEmpresaId(), usuario: `${user.nome} (Guapeco)`, perfil: "guapeco" };
  }
  return { empresaId: user.empresaId, usuario: user.nome, perfil: "rh" };
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
  /** Login simulado: entra direto com a usuária de demonstração do perfil escolhido. */
  login(perfil: PerfilUsuario = "rh"): Usuario {
    const user = perfil === "guapeco" ? GUAPECO_USUARIO : DEMO_USUARIO;
    setSessionUserId(user.id);
    return user;
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
    if (user?.perfil !== "rh") return null;
    return getState().db.empresas.find((e) => e.id === user.empresaId) ?? null;
  },
  /** Volta tudo ao estado inicial de demonstração (mantém o login). */
  restoreDemoData() {
    resetDatabase();
  },
};
