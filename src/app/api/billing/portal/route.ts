import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

// Redirect the signed-in tenant into Stripe's Customer Portal so they can
// update card, change plan, or cancel. Returns: { url }

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!artist)
    return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("artist_id", artist.id)
    .maybeSingle();
  if (!sub?.stripe_customer_id)
    return NextResponse.json({ error: "No Stripe customer yet — start a plan first" }, { status: 400 });

  const stripe = getStripe();
  const origin = request.headers.get("origin") ?? "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${origin}/command-center`,
  });
  return NextResponse.json({ url: session.url });
}
