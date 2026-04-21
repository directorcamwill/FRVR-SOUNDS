import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

// Stripe webhook endpoint. Point Stripe's webhook at this URL and paste the
// signing secret into STRIPE_WEBHOOK_SECRET. Handles: subscription created,
// updated, canceled, and invoice paid/failed. Syncs to the `subscriptions`
// table in Supabase.

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  if (!sig)
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET not set — rejecting webhook");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const raw = await request.text();
  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as {
          client_reference_id: string | null;
          customer: string;
          subscription: string;
          metadata?: { plan_id?: string };
        };
        if (!s.client_reference_id) break;
        await admin
          .from("subscriptions")
          .upsert(
            {
              artist_id: s.client_reference_id,
              plan_id: s.metadata?.plan_id ?? "starter",
              status: "active",
              stripe_customer_id: s.customer,
              stripe_subscription_id: s.subscription,
            },
            { onConflict: "artist_id" },
          );
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as {
          id: string;
          status: string;
          cancel_at_period_end: boolean;
          current_period_end: number;
          canceled_at: number | null;
        };
        await admin
          .from("subscriptions")
          .update({
            status:
              sub.status === "canceled"
                ? "canceled"
                : sub.status === "past_due"
                  ? "past_due"
                  : "active",
            current_period_ends_at: new Date(sub.current_period_end * 1000).toISOString(),
            canceled_at: sub.canceled_at
              ? new Date(sub.canceled_at * 1000).toISOString()
              : null,
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as { subscription: string };
        if (inv.subscription) {
          await admin
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", inv.subscription);
        }
        break;
      }
      default:
        // other events — ignore
        break;
    }
  } catch (e) {
    console.error("webhook handler error", e);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
