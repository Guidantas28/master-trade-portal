"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthBrandToggle } from "@/components/auth/auth-brand-toggle";

function LoginForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const invite = searchParams.get("invite")?.trim() ?? "";
  return <AuthBrandToggle initialEmail={email} initialInviteCode={invite} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthBrandToggle />}>
      <LoginForm />
    </Suspense>
  );
}
