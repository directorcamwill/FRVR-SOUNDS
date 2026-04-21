"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PLANS, type PlanId } from "@/lib/plans";

const VALID_PLANS: PlanId[] = ["starter", "pro", "studio"];

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialPlan = (() => {
    const raw = params.get("plan") ?? "";
    return VALID_PLANS.includes(raw as PlanId)
      ? (raw as PlanId)
      : ("pro" as PlanId);
  })();

  const [planId, setPlanId] = useState<PlanId>(initialPlan);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const plan = PLANS[planId];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, plan_id: planId },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Account created — check your email to confirm.");
    router.push("/onboarding");
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-white">Create your account</h1>
        <p className="text-sm text-[#A3A3A3] mt-1">
          Start your 14-day trial — no charge today.
        </p>
      </div>

      <div className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 p-3 mb-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#DC2626]">
              Selected plan
            </p>
            <p className="text-sm font-semibold text-white">
              {plan.name} · ${plan.priceMonthly}/mo
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-[10px] uppercase tracking-wider text-[#DC2626] hover:text-red-300"
          >
            Change
          </Link>
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {VALID_PLANS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlanId(p)}
              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                planId === p
                  ? "bg-[#DC2626] text-white border-[#DC2626]"
                  : "bg-[#111] text-[#A3A3A3] border-[#1A1A1A]"
              }`}
            >
              {PLANS[p].name} ${PLANS[p].priceMonthly}
            </button>
          ))}
        </div>
        <Badge
          variant="outline"
          className="text-[9px] bg-[#111] mt-2 uppercase tracking-wider"
        >
          14-day trial — no card required
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : `Start ${plan.name} trial`}
        </Button>
      </form>

      <p className="text-center text-sm text-[#A3A3A3] mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-[#DC2626] hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
