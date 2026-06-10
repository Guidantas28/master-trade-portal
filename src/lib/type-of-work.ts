/** Certificate SKUs — partner report uses the certificate template (mirrors master-os). */
export const CERTIFICATE_TYPE_OF_WORK_NAMES = [
  "Boiler Service",
  "Electrical Installation Condition Report (EICR)",
  "Portable Appliance Testing (PAT)",
  "Gas Safety Certificate (GSC)",
  "Fire Risk Assessment (FRA)",
  "Fire Alarm Certificate",
  "Emergency Lighting Certificate",
  "Fire Extinguisher Service (FES)",
] as const;

const CERTIFICATE_MATCH_KEYWORDS = [
  "eicr",
  "pat testing",
  "portable appliance",
  "gas safety",
  "cp12",
  "fire risk",
  "fire alarm",
  "emergency lighting",
  "fire extinguisher",
  "boiler service",
];

/** True when the label/title is a compliance certificate SKU. */
export function isCertificateTypeOfWork(value?: string | null): boolean {
  const raw = (value ?? "").trim();
  if (!raw) return false;
  const lower = raw.toLowerCase();
  if (CERTIFICATE_TYPE_OF_WORK_NAMES.some((name) => name.toLowerCase() === lower)) return true;
  return CERTIFICATE_MATCH_KEYWORDS.some((k) => lower.includes(k));
}
