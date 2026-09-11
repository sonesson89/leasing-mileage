// Formats a km value (or null) as a localized Swedish-mil string, e.g. "150,0"
export const fmtMil = (v: number | null): string =>
  v !== null
    ? (v / 10).toLocaleString("sv-SE", { maximumFractionDigits: 1 })
    : "—";
