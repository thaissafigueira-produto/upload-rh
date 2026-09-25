import type { ModoEnvio } from "@/types";

export const MODO_LABEL: Record<ModoEnvio, string> = {
  completa: "Base completa",
  novos: "Só novos colaboradores",
  desligamentos: "Só desligamentos",
};
