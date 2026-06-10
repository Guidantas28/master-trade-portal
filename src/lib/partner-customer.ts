/** Partner-facing label — never expose B2B account names (e.g. Housekeep). */
export const PARTNER_CUSTOMER_LABEL = "Customer";

export function partnerCustomerInitials(): string {
  return "CU";
}

/** Short location line for cards (postcode + truncated address). */
export function partnerLocationLine(postcode: string, address?: string): string {
  const pc = postcode?.trim();
  const addr = address?.trim();
  if (pc && addr) return `${pc} · ${addr}`;
  return pc || addr || "—";
}
