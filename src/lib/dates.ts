/** Aceita AAAA-MM-DD, DD/MM/AAAA, DD-MM-AAAA ou número de série do Excel. Devolve AAAA-MM-DD ou null. */
export function normalizeDate(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  let y: number;
  let m: number;
  let d: number;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(text);
  const br = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
  if (iso) {
    [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else if (br) {
    [d, m, y] = [Number(br[1]), Number(br[2]), Number(br[3])];
  } else if (/^\d{5}(\.\d+)?$/.test(text)) {
    const date = new Date(Math.round((Number(text) - 25569) * 86400000));
    [y, m, d] = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
  } else {
    return null;
  }

  const check = new Date(y, m - 1, d);
  if (check.getFullYear() !== y || check.getMonth() !== m - 1 || check.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** AAAA-MM-DD → DD/MM/AAAA */
export function isoDateToBR(isoDate: string) {
  return isoDate.split("-").reverse().join("/");
}

/** AAAA-MM-DD → data/hora ISO ao meio-dia (evita virar o dia por fuso horário). */
export function isoDateToNoon(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toISOString();
}
