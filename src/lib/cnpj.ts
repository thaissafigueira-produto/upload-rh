export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function sameCnpj(a: string, b: string) {
  const da = onlyDigits(a);
  return da.length > 0 && da === onlyDigits(b);
}

const LEGAL_SUFFIX = /\s+(ltda\.?|s\.?\/?a\.?|eireli|me|epp)$/i;

export function shortRazaoSocial(razaoSocial: string) {
  const trimmed = razaoSocial.replace(LEGAL_SUFFIX, "").trim();
  return trimmed.length > 28 ? `${trimmed.slice(0, 27)}…` : trimmed;
}
