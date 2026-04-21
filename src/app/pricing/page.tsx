"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { PLANS, visiblePricingPlans } from "@/lib/plans";

const FEATURE_SUMMARIES: Record<string, string[]> = {
  starter: [
    "Song Vault (up to 10 songs)",
    "Brand Wiki editor",
    "Sync Directory (67 terms)",
    "Placements Reference",
    "Supervisor Directory",
    "Song Lab projects (no AI)",
    "5 AI agent runs / month",
  ],
  pro: [
    "Everything in Starter",
    "Unlimited songs",
    "All AI agents (Brand Director, Producer, Songwriter, Collab)",
    "Brand Fit + Sync Readiness scoring",
    "Placement + Supervisor matchers",
    "Pattern Intelligence",
    "Guided Recommendations",
    "Pipeline tracking + Package Builder",
    "100 AI agent runs / month",
  ],
  studio: [
    "Everything in Pro",
    "Unlimited AI agent runs",
    "Metaphor Hub",
    "Money / LLC setup tools",
    "Priority FRVR Sounds Library intake",
    "Monthly 1:1 strategy call",
    "Early access to new features",
  ],
};

export default function PricingPage() {
  const plans = visiblePricingPlans();

  return (
    <main className="min-h-screen bg-black py-12">
      <div className="max-w-5xl mx-auto px-6 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-[0.2em] text-[#DC2626]">
              FRVR SOUNDS
            </span>
            <Badge
              variant="outline"
              className="text-[10px] bg-[#111] uppercase tracking-wider"
            >
              Pricing
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-white">
            Pick the plan that fits your pitch
          </h1>
          <p className="text-sm text-[#A3A3A3] max-w-2xl mx-auto leading-relaxed">
            Every plan includes the Sync Directory, Placements reference, and
            Supervisor directory. AI agents and matching tools unlock on Pro.
            Unlimited runs + library priority on Studio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <Card
              key={p.id}
              className={
                p.highlight
                  ? "border-[#DC2626]/50 bg-gradient-to-br from-[#DC2626]/5 to-transparent"
                  : ""
              }
            >
              <CardContent className="py-6 space-y-4">
                {p.highlight && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30 uppercase tracking-wider"
                  >
                    Most popular
                  </Badge>
                )}
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#666]">
                    {p.name}
                  </p>
                  <p className="text-sm text-[#A3A3A3] mt-1 leading-relaxed">
                    {p.tagline}
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">
                    ${p.priceMonthly}
                  </span>
                  <span className="text-sm text-[#A3A3A3]">/mo</span>
                </div>
                <ul className="space-y-1.5">
                  {(FEATURE_SUMMARIES[p.id] ?? []).map((f) => (
                    <li
                      key={f}
                      className="text-xs text-[#D4D4D4] leading-relaxed flex gap-2"
                    >
                      <Check className="size-3.5 shrink-0 text-emerald-400 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`/signup?plan=${p.id}`}>
                  <Button
                    className="w-full"
                    variant={p.highlight ? "default" : "outline"}
                  >
                    <Sparkles className="size-3.5 mr-1.5" />
                    Start with {p.name}
                  </Button>
                </Link>
                <p className="text-[10px] text-[#555] text-center">
                  {PLANS[p.id].agent_run_quota === null
                    ? "Unlimited AI runs"
                    : `${PLANS[p.id].agent_run_quota} AI runs / month`}
                  {" · "}
                  {PLANS[p.id].song_vault_cap === null
                    ? "Unlimited songs"
                    : `${PLANS[p.id].song_vault_cap} song cap`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center text-xs text-[#555]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#DC2626] hover:text-red-300">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
