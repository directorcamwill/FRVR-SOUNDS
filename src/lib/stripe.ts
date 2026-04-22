import Stripe from "stripe";

// Lazy-loaded Stripe client. Requires STRIPE_SECRET_KEY in env.
// Call `getStripe()` from server routes — throws a clear error if keys are missing
// so the user knows to add them before going live.

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY missing in .env.local — add it before using billing endpoints.",
    );
  }
  client = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  return client;
}

// Map FRVR Sounds plan IDs to Stripe price IDs. Fill these in once the
// products exist in Stripe dashboard. Each env var is required for its plan.
export function getStripePriceId(planId: "starter" | "pro" | "studio"): string {
  const map = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    studio: process.env.STRIPE_PRICE_STUDIO,
  } as const;
  const id = map[planId];
  if (!id) {
    throw new Error(
      `STRIPE_PRICE_${planId.toUpperCase()} missing in .env.local`,
    );
  }
  return id;
}
