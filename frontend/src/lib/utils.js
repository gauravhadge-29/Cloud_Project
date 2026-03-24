export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(value) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat().format(n);
}

