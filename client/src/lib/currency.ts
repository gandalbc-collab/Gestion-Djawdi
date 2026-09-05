export const CURRENCIES = ["GNF", "CFA", "EUR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GNF: "GNF",
  CFA: "FCFA",
  EUR: "€",
  USD: "$",
};

export function formatAmount(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount);
  return `${formatted} ${symbol}`;
}
