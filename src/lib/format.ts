import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
