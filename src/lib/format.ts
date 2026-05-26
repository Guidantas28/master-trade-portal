// UK formatting helpers — ported from primitives.jsx.

export function formatGBP(n: number, opts: Intl.NumberFormatOptions = {}): string {
  const o: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...opts,
  };
  return new Intl.NumberFormat("en-GB", o).format(n);
}

export function formatGBPdec(n: number): string {
  return formatGBP(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
