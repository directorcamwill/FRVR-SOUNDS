"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Sparkles } from "lucide-react";
import { useMyAccess, minPlanForFeature } from "@/hooks/use-my-access";
import type { FeatureKey } from "@/lib/plans";

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  // When the user doesn't have access: inline lock card (default) or hide entirely.
  mode?: "lock_card" | "hidden";
  // Custom label shown on the lock card.
  label?: string;
}

export function FeatureGate({
  feature,
  children,
  mode = "lock_card",
  label,
}: FeatureGateProps) {
  const { access, loading } = useMyAccess();
  const [open, setOpen] = useState(false);

  if (loading) return null;
  if (access.hasFeature(feature)) return <>{children}</>;
  if (mode === "hidden") return null;

  const minPlan = minPlanForFeature(feature);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-lg border border-[#1A1A1A] bg-[#0B0B0B] p-4 hover:border-[#DC2626]/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 p-2">
            <Lock className="size-4 text-[#DC2626]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              {label ?? "Feature locked"}
            </p>
            <p className="text-xs text-[#A3A3A3]">
              {minPlan
                ? `Unlock on the ${minPlan.name} plan ($${minPlan.priceMonthly}/mo)`
                : "Upgrade to unlock"}
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
          >
            Upgrade
          </Badge>
        </div>
      </button>
      <UpgradeDialog
        open={open}
        onClose={() => setOpen(false)}
        feature={feature}
        label={label}
      />
    </>
  );
}

export function UpgradeDialog({
  open,
  onClose,
  feature,
  label,
}: {
  open: boolean;
  onClose: () => void;
  feature: FeatureKey;
  label?: string;
}) {
  const minPlan = minPlanForFeature(feature);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#DC2626]" />
            <DialogTitle>Upgrade to unlock</DialogTitle>
          </div>
          <DialogDescription>
            {label ?? "This feature"}{" "}
            {minPlan
              ? `is included in the ${minPlan.name} plan ($${minPlan.priceMonthly}/mo) and above.`
              : "is not available on your current plan."}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 p-4 space-y-2">
          <p className="text-sm text-white font-semibold">
            What you&apos;ll unlock on {minPlan?.name}
          </p>
          <ul className="text-xs text-[#D4D4D4] space-y-0.5">
            <li>· All AI guidance agents (Producer, Songwriter, Collab)</li>
            <li>· Brand Fit + Sync Readiness scoring</li>
            <li>· Placement Matches + Supervisor Matches</li>
            <li>· Pattern Intelligence + Guided Recommendations</li>
            <li>· Pipeline tracking + Package Builder</li>
          </ul>
        </div>
        <DialogFooter>
          <Button size="sm" variant="outline" onClick={onClose}>
            Maybe later
          </Button>
          <Link href="/pricing">
            <Button size="sm">See plans</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
