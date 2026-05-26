// Stripe server client. Mirrors the master-os pattern.
// SERVER ONLY — never import into a client component.

import Stripe from "stripe";

let instance: Stripe | null = null;

function getStripe(): Stripe | null {
  if (instance) return instance;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  instance = new Stripe(key, { typescript: true });
  return instance;
}

export const stripe = getStripe();

export function requireStripe(): Stripe {
  const client = getStripe();
  if (!client) throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  return client;
}

/** Recurring price for the £99/mo Fixfy Pro plan (create it in Stripe, then set the env). */
export const FIXFY_PRO_PRICE_ID = process.env.STRIPE_PRICE_FIXFY_PRO;
