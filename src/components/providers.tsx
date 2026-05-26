"use client";

import type { ReactNode } from "react";
import type { Partner } from "@/types";
import { ToastProvider } from "@/components/ui/toast";
import { PartnerProvider } from "@/components/partner-context";
import { JobsProvider } from "@/components/jobs-context";

export function Providers({ partner, children }: { partner: Partner; children: ReactNode }) {
  return (
    <PartnerProvider partner={partner}>
      <JobsProvider>
        <ToastProvider>{children}</ToastProvider>
      </JobsProvider>
    </PartnerProvider>
  );
}
