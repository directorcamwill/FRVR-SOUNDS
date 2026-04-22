import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

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
        // Pull the subscription to read trial_end set by trial_period_days: 7.
        let trialEnds: string | null = null;
        let initialStatus = "active";
        try {
          const fresh = await stripe.subscriptions.retrieve(s.subscription);
          initialStatus = fresh.status === "trialing" ? "trialing" : "active";
          if (fresh.trial_end)
            trialEnds = new Date(fresh.trial_end * 1000).toISOString();
        } catch {
          // Fall back to active / no trial if fetch fails
        }
        await admin
          .from("subscriptions")
          .upsert(
            {
              artist_id: s.client_reference_id,
              plan_id: s.metadata?.plan_id ?? "starter",
              status: initialStatus,
              trial_ends_at: trialEnds,
              agent_runs_this_period: 0,
              agent_runs_period_started_at: new Date().toISOString(),
              stripe_customer_id: s.customer,
              stripe_subscription_id: s.subscription,
            },
            { onConflict: "artist_id" },
          );
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        // `current_period_end` moved from Subscription to Subscription.items[] in the
        // 2026-03-25.dahlia API. Read from items first; fall back to legacy location.
        const itemCpe = sub.items?.data?.[0] as { current_period_end?: number } | undefined;
        const legacyCpe = (sub as unknown as { current_period_end?: number }).current_period_end;
        const cpe = itemCpe?.current_period_end ?? legacyCpe ?? null;
        const trialEnds = sub.trial_end
          ? new Date(sub.trial_end * 1000).toISOString()
          : null;
        const normalizedStatus =
          sub.status === "canceled"
            ? "canceled"
            : sub.status === "past_due"
              ? "past_due"
              : sub.status === "trialing"
                ? "trialing"
                : "active";

        // Pull the current row so we can detect a status transition (trial → active)
        // and reset the usage counter when a fresh billing period begins.
        const { data: existing } = await admin
          .from("subscriptions")
          .select("status, current_period_ends_at, agent_runs_period_started_at")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle();

        const newPeriodStart =
          !!existing &&
          (existing.status !== normalizedStatus ||
            (cpe &&
              existing.current_period_ends_at &&
              new Date(existing.current_period_ends_at).getTime() !== cpe * 1000));

        await admin
          .from("subscriptions")
          .update({
            status: normalizedStatus,
            trial_ends_at: trialEnds,
            current_period_ends_at: cpe ? new Date(cpe * 1000).toISOString() : null,
            canceled_at: sub.canceled_at
              ? new Date(sub.canceled_at * 1000).toISOString()
              : null,
            ...(newPeriodStart
              ? {
                  agent_runs_this_period: 0,
                  agent_runs_period_started_at: new Date().toISOString(),
                }
              : {}),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        // `invoice.subscription` removed in dahlia — it's now under parent.subscription_details.
        const subId =
          (inv as unknown as { subscription?: string }).subscription ??
          inv.parent?.subscription_details?.subscription ??
          null;
        if (subId) {
          await admin
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", subId);
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
