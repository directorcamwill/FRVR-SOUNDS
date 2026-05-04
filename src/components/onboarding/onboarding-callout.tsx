"use client";

// Surfaces a small banner pointing the user to /onboarding/quiz when they
// haven't completed it. Self-contained: fetches /api/onboarding/quiz on
// mount, hides itself when a completed_at exists. Local-storage dismiss
// is honored so an artist who explicitly dismisses the prompt isn't nagged
// every page load — the quiz is still reachable from /settings or the
// callout's parent route.

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import Link from "next/link";

const DISMISS_KEY = "frvr_onboarding_callout_dismissed_v1";

export function OnboardingCallout() {
  const [needs, setNeeds] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Honor a local dismiss before hitting the network.
      try {
        if (
          typeof window !== "undefined" &&
          window.localStorage.getItem(DISMISS_KEY)
        ) {
          if (!cancelled) setNeeds(false);
          return;
        }
      } catch {
        // localStorage may be unavailable (private mode, etc) — fall through
      }
      try {
        const res = await fetch("/api/onboarding/quiz");
        if (!res.ok) {
          if (!cancelled) setNeeds(false);
          return;
        }
        const data = await res.json();
        const completed = !!data?.response?.completed_at;
        if (!cancelled) setNeeds(!completed);
      } catch {
        if (!cancelled) setNeeds(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setNeeds(false);
  };

  if (!needs) return null;

  return (
    <Card className="border-[#DC2626]/30 bg-zinc-950/60">
      <CardContent className="p-4 flex items-start gap-3">
        <CheckCircle2 className="size-4 text-[#DC2626] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white">
            Take the 10-question Tier Quiz
          </p>
          <p className="text-xs text-white/60 mt-0.5">
            Behavioral, not survey. We pick a tier (Starter / Pro Catalog / Sync Prepared) that fits your real cadence and revenue maturity. ~3 minutes.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
            <Link
              href="/onboarding/quiz"
              className="inline-flex items-center gap-1.5 text-xs text-[#DC2626] hover:underline"
            >
              Start the quiz <ArrowRight className="size-3" />
            </Link>
            <Link
              href="/onboarding/quickstart"
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
            >
              Or — 5-minute quickstart instead
            </Link>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-white/30 hover:text-white shrink-0"
        >
          <X className="size-4" />
        </button>
      </CardContent>
    </Card>
  );
}
