export type ServiceCategory = "Trades" | "Certificates" | "Cleaning";

export const SERVICE_CATEGORY_ORDER: ServiceCategory[] = ["Trades", "Certificates", "Cleaning"];

export function serviceCategory(name: string): ServiceCategory {
  const n = name.toLowerCase();
  if (/\bclean|\bhousekeep|\bsaniti[sz]|\bbuilders?\s+clean|\bdeep\s+clean|\bend of tenancy|\(ab\)/.test(n)) return "Cleaning";

  const codeMatch = n.match(/^\(([a-z0-9]{2,6})\)/);
  if (codeMatch && codeMatch[1] !== "ab") return "Certificates";

  if (
    /\bcp12\b|\beicr\b|\bpat\b|\bgas safety|\bcertificate|\bcertification|\binspection|\bniceic|\bnapit|\bwras|\bbafe|\bf-gas|\bloler|\bepc\b|\blegionella|\basbestos|\bfire alarm|\bfire extinguish|\bfire risk|\bemergency lighting|\belectrical installation condition|\bboiler service|\(cp12\)|\(fes\)|\(fra\)/.test(
      n,
    )
  ) {
    return "Certificates";
  }
  return "Trades";
}
