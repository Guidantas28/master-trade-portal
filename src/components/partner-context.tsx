"use client";

// Client-side access to the signed-in partner, fed by the server page.
// Screens call usePartner() instead of importing the mock MARCUS.

import { createContext, useContext, type ReactNode } from "react";
import type { Partner } from "@/types";

const PartnerContext = createContext<Partner | null>(null);

export function PartnerProvider({ partner, children }: { partner: Partner; children: ReactNode }) {
  return <PartnerContext.Provider value={partner}>{children}</PartnerContext.Provider>;
}

export function usePartner(): Partner {
  const partner = useContext(PartnerContext);
  if (!partner) throw new Error("usePartner must be used within a PartnerProvider");
  return partner;
}
