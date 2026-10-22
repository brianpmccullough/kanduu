/** Replaces {0}, {1}, ... in a localized string template. */
export function formatString(template: string, ...values: string[]): string {
  return template.replace(/\{(\d+)\}/g, (match: string, index: string) => {
    const value = values[Number(index)];
    return value === undefined ? match : value;
  });
}

/** A price with two decimals in the given locale, e.g. "1,234.50". */
export function formatPrice(value: number, locale: string | undefined): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

/** A signed percent from a fraction, e.g. 0.0123 becomes "+1.23%". */
export function formatPercentChange(fraction: number, locale: string | undefined): string {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(fraction);
  return fraction > 0 ? `+${formatted}` : formatted;
}

/** An ISO date string as a local date and time; unparseable values are returned unchanged. */
export function formatAsOf(isoDate: string, locale: string | undefined): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}
