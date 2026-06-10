/** Partner contract types shown in the trade portal onboarding / policies step. */
export const PARTNER_CONTRACT_TYPES = [
  "terms_of_use",
  "self_bill_agreement",
  "contractor_service_agreement",
] as const;

export type PartnerContractType = (typeof PARTNER_CONTRACT_TYPES)[number];

export const PARTNER_CONTRACT_TITLES: Record<PartnerContractType, string> = {
  terms_of_use: "Platform Terms of Use",
  self_bill_agreement: "Self-Billing Agreement",
  contractor_service_agreement: "Contractor Service Agreement",
};
