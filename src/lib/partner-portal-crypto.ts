import { createHash, randomBytes } from "crypto";

export function hashPartnerPortalToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
