"use client";

// Client helpers to start the £99/mo subscription checkout and open the billing portal.

async function postJson(path: string): Promise<{ url?: string; error?: string }> {
  const res = await fetch(path, { method: "POST" });
  return res.json().catch(() => ({ error: "Unexpected response" }));
}

export async function startCheckout(): Promise<void> {
  const data = await postJson("/api/billing/checkout");
  if (data.url) window.location.href = data.url;
  else alert(data.error || "Couldn't start checkout. Is STRIPE_PRICE_FIXFY_PRO set?");
}

export async function openBillingPortal(): Promise<void> {
  const data = await postJson("/api/billing/portal");
  if (data.url) window.location.href = data.url;
  else alert(data.error === "no_subscription" ? "No subscription yet — switch to Pro first." : data.error || "Couldn't open billing portal.");
}
