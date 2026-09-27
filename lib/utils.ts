import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

export function formatDate(
  value: string | Date,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
) {
  return new Intl.DateTimeFormat("en-IN", opts).format(new Date(value));
}

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function discountPercent(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function totalStock(sizes: { stock: number }[]) {
  return sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
}

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  confirmed: "bg-sky-400/15 text-sky-300 ring-sky-400/30",
  processing: "bg-violet-400/15 text-violet-300 ring-violet-400/30",
  shipped: "bg-indigo-400/15 text-indigo-300 ring-indigo-400/30",
  delivered: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  cancelled: "bg-rose-400/15 text-rose-300 ring-rose-400/30",
  paid: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  refunded: "bg-rose-400/15 text-rose-300 ring-rose-400/30",
};
