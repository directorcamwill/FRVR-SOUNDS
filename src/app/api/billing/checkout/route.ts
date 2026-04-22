import { createClient } from "@/lib/supabase/server";
import { getStripe, getStripePriceId } from "@/lib/stripe";
import { NextResponse } from "next/server";

// Create a Stripe Checkout Session for a plan upgrade/signup.
// Body: { plan: 'starter' | 'pro' | 'studio' }
// Returns: { url } — client should window.location = url

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const plan = body?.plan as "starter" | "pro" | "studio" | undefined;
  if (!plan || !["starter", "pro", "studio"].includes(plan))
    return NextResponse.json({ error: "plan must be starter|pro|studio" }, { status: 400 });

  // Look up the tenant's current subscription to find an existing Stripe customer id
  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!artist)
    return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("artist_id", artist.id)
    .maybeSingle();

  const stripe = getStripe();
  const priceId = getStripePriceId(plan);

  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: sub?.stripe_customer_id || undefined,
    customer_email: sub?.stripe_customer_id ? undefined : user.email,
    client_reference_id: artist.id,
    metadata: { artist_id: artist.id, plan_id: plan },
    subscription_data: {
      trial_period_days: 7,
      metadata: { artist_id: artist.id, plan_id: plan },
    },
    success_url: `${origin}/command-center?billing=success`,
    cancel_url: `${origin}/pricing?billing=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
