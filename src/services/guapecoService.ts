import { daysSince } from "@/lib/format";
import type { ConferenciaCnpj, Empresa } from "@/types";
import { getContext } from "./authService";
import { getDb, setFocusEmpresaId } from "./database";

export interface EmpresaResumo {
  empresa: Empresa;
  naBase: number;
  comAdesao: number;
  naoEncontrados: number;
  ultimaAtualizacao: string | null;
  diasSemAtualizar: number | null;
  desatualizada: boolean;
  conferencia: (ConferenciaCnpj & { atrasada: boolean }) | null;
}

const LIMITE_DIAS = 30;

export const guapecoService = {
  /** Foca uma empresa para a equipe Guapeco: a partir daí os services de dados leem essa empresa. */
  focusEmpresa(empresaId: string) {
    if (getContext().perfil === "guapeco") setFocusEmpresaId(empresaId);
  },

  clearFocus() {
    setFocusEmpresaId("");
  },

  /** Visão de todas as empresas (somente equipe Guapeco). */
  listEmpresas(): EmpresaResumo[] {
    if (getContext().perfil !== "guapeco") return [];
    const db = getDb();
    return db.empresas
      .map((empresa) => {
        const employees = db.employees.filter((e) => e.empresaId === empresa.id && e.status !== "desligado");
        const latest = db.versions
          .filter((v) => v.empresaId === empresa.id)
          .sort((a, b) => b.data.localeCompare(a.data))[0];
        const pendente = db.conferencias
          .filter((c) => c.empresaId === empresa.id && c.status !== "confirmada")
          .sort((a, b) => a.competencia.localeCompare(b.competencia))[0];
        const dias = latest ? daysSince(latest.data) : null;
        return {
          empresa,
          naBase: employees.length,
          comAdesao: employees.filter((e) => e.beneficio === "com_adesao").length,
          naoEncontrados: employees.filter((e) => e.status === "nao_encontrado").length,
          ultimaAtualizacao: latest?.data ?? null,
          diasSemAtualizar: dias,
          desatualizada: dias === null || dias > LIMITE_DIAS,
          conferencia: pendente ? { ...pendente, atrasada: new Date(pendente.prazo).getTime() < Date.now() } : null,
        };
      })
      .sort((a, b) => a.empresa.nome.localeCompare(b.empresa.nome));
  },

  getEmpresa(empresaId: string): Empresa | undefined {
    if (getContext().perfil !== "guapeco") return undefined;
    return getDb().empresas.find((e) => e.id === empresaId);
  },
};
