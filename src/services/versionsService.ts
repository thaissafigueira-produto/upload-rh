import type { BaseVersion, Upload } from "@/types";
import { getContext } from "./authService";
import { getDb } from "./database";

export const versionsService = {
  /** Versões da base, da mais recente para a mais antiga. */
  list(): BaseVersion[] {
    const { empresaId } = getContext();
    return getDb()
      .versions.filter((v) => v.empresaId === empresaId)
      .sort((a, b) => b.numero - a.numero);
  },

  get(id: string): BaseVersion | undefined {
    return versionsService.list().find((v) => v.id === id);
  },

  /** Última atualização confirmada, com os números do que mudou. */
  latestUpdate(): { version: BaseVersion; upload: Upload } | null {
    const version = versionsService.list()[0];
    if (!version) return null;
    const upload = getDb().uploads.find((u) => u.id === version.uploadId && u.empresaId === version.empresaId);
    return upload ? { version, upload } : null;
  },
};
