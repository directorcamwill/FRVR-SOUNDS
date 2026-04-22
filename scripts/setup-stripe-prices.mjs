// Creates the 3 FRVR Sounds products + monthly prices in Stripe, then
// appends STRIPE_PRICE_STARTER / _PRO / _STUDIO to .env.local. Idempotent:
// if a price at the right amount + plan_id lookup_key already exists, reuse it.

import fs from "node:fs";
import Stripe from "stripe";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf-8").split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")]; }),
);

if (!env.STRIPE_SECRET_KEY) { console.error("STRIPE_SECRET_KEY missing"); process.exit(1); }
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const PLANS = [
  { key: "STARTER", name: "FRVR Sounds Starter", amount_cents: 4900, lookup: "frvr_starter_monthly" },
  { key: "PRO",     name: "FRVR Sounds Pro",     amount_cents: 19900, lookup: "frvr_pro_monthly" },
  { key: "STUDIO",  name: "FRVR Sounds Studio",  amount_cents: 49900, lookup: "frvr_studio_monthly" },
];

const results = {};

for (const plan of PLANS) {
  console.log(`\n${plan.key} (${plan.name}, $${plan.amount_cents/100}/mo)`);

  // Check for existing price by lookup_key (idempotent).
  const existing = await stripe.prices.list({ lookup_keys: [plan.lookup], active: true, limit: 1 });
  if (existing.data[0]) {
    console.log(`  reusing existing price ${existing.data[0].id}`);
    results[plan.key] = existing.data[0].id;
    continue;
  }

  const product = await stripe.products.create({ name: plan.name });
  console.log(`  product ${product.id}`);

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.amount_cents,
    currency: "usd",
    recurring: { interval: "month" },
    lookup_key: plan.lookup,
    nickname: `${plan.name} monthly`,
  });
  console.log(`  price ${price.id}`);
  results[plan.key] = price.id;
}

// Append price env vars (replacing any existing STRIPE_PRICE_* lines)
let file = fs.readFileSync(".env.local", "utf-8");
for (const [key, id] of Object.entries(results)) {
  const varName = `STRIPE_PRICE_${key}`;
  const re = new RegExp(`^${varName}=.*$`, "m");
  if (re.test(file)) file = file.replace(re, `${varName}=${id}`);
  else file += `\n${varName}=${id}`;
}
if (!file.endsWith("\n")) file += "\n";
fs.writeFileSync(".env.local", file);

console.log("\n.env.local updated:");
for (const [key, id] of Object.entries(results)) console.log(`  STRIPE_PRICE_${key}=${id}`);
