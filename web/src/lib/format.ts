// Display formatting lives in one place so every table/card shows money and dates identically.
// Intl.* uses the browser's locale rules, so no date/currency library is needed for this.

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export const formatPrice = (value: number): string => currency.format(value);

// The API sends ISO-8601 strings; the browser renders them in the viewer's own time zone.
export const formatDateTime = (iso: string): string => dateTime.format(new Date(iso));
