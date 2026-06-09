import { format, parseISO } from "date-fns";

export function formatRupiah(amount: number | null | undefined): string {
  if (amount == null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    return format(parseISO(dateString), "dd/MM/yyyy");
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    return format(parseISO(dateString), "dd/MM/yyyy HH:mm");
  } catch {
    return dateString;
  }
}
