import { daysSince } from "@/lib/format";
import type { ConferenciaCnpj } from "@/types";
import { cnpjService } from "./cnpjService";
import { employeesService } from "./employeesService";
import { versionsService } from "./versionsService";

export type AtencaoItem =
  | { tipo: "conferencia"; conferencia: ConferenciaCnpj }
  | { tipo: "nao_encontrados"; quantidade: number }
  | { tipo: "base_desatualizada"; dias: number };

export const dashboardService = {
  overview() {
    const latest = versionsService.latestUpdate();
    const naoEncontrados = employeesService.countNaoEncontrados();
    const conferencia = cnpjService
      .listConferencias()
      .filter((c) => c.status !== "confirmada")
      .sort((a, b) => a.competencia.localeCompare(b.competencia))[0];

    const atencao: AtencaoItem[] = [];
    if (conferencia) atencao.push({ tipo: "conferencia", conferencia });
    if (naoEncontrados > 0) atencao.push({ tipo: "nao_encontrados", quantidade: naoEncontrados });
    if (latest && daysSince(latest.version.data) > 30) {
      atencao.push({ tipo: "base_desatualizada", dias: daysSince(latest.version.data) });
    }

    return {
      naBase: employeesService.countNaBase(),
      novosUltimaAtualizacao: latest?.upload.novos ?? 0,
      pendencias: naoEncontrados,
      latest,
      atencao,
    };
  },
};
