// One-off: create the "Fixfy Pro" Product + £99/mo recurring Price in your Stripe (test).
// Run:  node --env-file=.env.local scripts/create-stripe-price.mjs
// Then paste the printed price id into .env.local as STRIPE_PRICE_FIXFY_PRO.

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY missing. Run with: node --env-file=.env.local scripts/create-stripe-price.mjs");
  process.exit(1);
}
if (!key.startsWith("sk_test_")) {
  console.error(`Refusing to run: STRIPE_SECRET_KEY is not a test key (${key.slice(0, 8)}…). This script is test-mode only.`);
  process.exit(1);
}

const stripe = new Stripe(key, { typescript: true });

const product = await stripe.products.create({
  name: "Fixfy Pro",
  description: "Trade portal — 0% commission, unlimited leads & jobs, Net-7 self-bill payouts.",
});

const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 9900, // £99.00
  currency: "gbp",
  recurring: { interval: "month" },
});

console.log("Created (test mode):");
console.log("  Product:", product.id);
console.log("  Price  :", price.id);
console.log("\nAdd this line to .env.local:\nSTRIPE_PRICE_FIXFY_PRO=" + price.id);
