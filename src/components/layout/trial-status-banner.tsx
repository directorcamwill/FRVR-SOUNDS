"use client";

import Link from "next/link";
import { Clock, Sparkles, CreditCard } from "lucide-react";
import { useMyAccess } from "@/hooks/use-my-access";

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function TrialStatusBanner() {
  const { access, loading } = useMyAccess();
  if (loading) return null;

  // V2 — incomplete: user signed up but hasn't started Stripe trial yet.
  // Push them to /pricing to start the 7-day-with-card flow.
  if (access.subscription_status === "incomplete") {
    return (
      <div className="mb-4 rounded-xl border border-[#DC2626]/30 bg-gradient-to-r from-[#DC2626]/10 via-[#DC2626]/5 to-transparent px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <CreditCard className="size-4 text-[#DC2626]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#DC2626] font-semibold">
            Start your 7-day trial
          </span>
        </div>
        <p className="flex-1 min-w-0 text-sm text-white leading-snug">
          Add a card to unlock the full system for 7 days. No charge today; cancel anytime before day 7.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-white px-3 py-1.5 rounded-full border border-[#DC2626]/40 bg-[#DC2626]/10 hover:bg-[#DC2626]/20 transition-colors shrink-0"
        >
          <Sparkles className="size-3.5" />
          Start trial
        </Link>
      </div>
    );
  }

  if (!access.is_trialing) return null;

  const days = daysLeft(access.trial_ends_at);
  const planName = access.plan_name ?? "your plan";
  const runsUsed = access.agent_runs_this_period;
  const runsLimit = access.agent_runs_limit;

  const daysLabel =
    days === null
      ? "Trial active"
      : days === 0
        ? "Ends today"
        : days === 1
          ? "1 day left"
          : `${days} days left`;

  return (
    <div className="mb-4 rounded-xl border border-[#DC2626]/30 bg-gradient-to-r from-[#DC2626]/10 via-[#DC2626]/5 to-transparent px-4 py-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 shrink-0">
        <Clock className="size-4 text-[#DC2626]" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#DC2626] font-semibold">
          Trial · {daysLabel}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white leading-snug">
          You&apos;re on a 7-day trial of <span className="font-semibold">{planName}</span>
          {runsLimit !== null && (
            <>
              {" · "}
              <span className="tabular-nums text-white/80">
                {runsUsed}/{runsLimit} AI runs used
              </span>
            </>
          )}
        </p>
        <p className="text-[11px] text-white/50 mt-0.5">
          Pro Catalog and Sync Prepared features unlock when your card is charged.
        </p>
      </div>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-white px-3 py-1.5 rounded-full border border-[#DC2626]/40 bg-[#DC2626]/10 hover:bg-[#DC2626]/20 transition-colors shrink-0"
      >
        <Sparkles className="size-3.5" />
        Activate now
      </Link>
    </div>
  );
}
