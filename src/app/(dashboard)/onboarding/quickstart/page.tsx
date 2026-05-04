"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Check,
  Flame,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EMOTION_OPTIONS = [
  "longing",
  "reverent",
  "propulsive",
  "nocturnal",
  "grief",
  "euphoric",
  "tense",
  "intimate",
  "defiant",
  "hopeful",
  "lonely",
  "powerful",
  "numb",
  "restless",
];

interface Artifact {
  hook: string;
  caption: string;
  post_format: { name: string; structure: string };
  reasoning: string;
  confidence: number | null;
}

export default function QuickstartPage() {
  const [corePain, setCorePain] = useState("");
  const [emotions, setEmotions] = useState<string[]>([]);
  const [primaryAudience, setPrimaryAudience] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [artifact, setArtifact] = useState<Artifact | null>(null);

  const canSubmit =
    corePain.trim().length >= 20 &&
    emotions.length >= 1 &&
    primaryAudience.trim().length >= 10;

  const toggleEmotion = (e: string) => {
    setEmotions((prev) =>
      prev.includes(e)
        ? prev.filter((x) => x !== e)
        : prev.length >= 4
          ? prev
          : [...prev, e],
    );
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/quickstart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          core_pain: corePain,
          desired_emotions: emotions,
          primary_audience: primaryAudience,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Quickstart failed");
      setArtifact(data.artifact);
      toast.success("First piece ready. Streak day 1 started.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Quickstart failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (artifact) {
    return <ArtifactView artifact={artifact} />;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Link
          href="/command-center"
          className="inline-flex items-center text-xs text-white/50 hover:text-white"
        >
          <ArrowLeft className="size-3 mr-1" />
          Back to Command Center
        </Link>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mt-2">
          Onboarding · 5-minute quickstart
        </p>
        <h1 className="text-2xl font-bold text-white">
          3 questions. We give you a piece you can ship today.
        </h1>
        <p className="text-sm text-[#A3A3A3] mt-1">
          Skip the full Brand Journey for now — answer these and the Director hands you a hook + caption + post format anchored to your real identity, not a template.
        </p>
      </div>

      <Card className="border-white/10 bg-zinc-950/60">
        <CardContent className="p-6 md:p-8 space-y-6">
          <Field
            number={1}
            prompt="What pain does your music resolve for your listener that no other song in their queue can?"
            help="Not a genre. A specific feeling in a specific moment."
            valid={corePain.trim().length >= 20}
          >
            <Textarea
              value={corePain}
              onChange={(e) => setCorePain(e.target.value)}
              placeholder="The feeling of driving home at 2am after you said the thing you couldn't take back."
              rows={3}
            />
            <CharCount value={corePain.length} min={20} />
          </Field>

          <Field
            number={2}
            prompt="What do you want listeners to feel in the first 15 seconds?"
            help="Pick 1–4. Specific, not polite."
            valid={emotions.length >= 1}
          >
            <div className="flex flex-wrap gap-2">
              {EMOTION_OPTIONS.map((e) => {
                const selected = emotions.includes(e);
                const disabled = !selected && emotions.length >= 4;
                return (
                  <button
                    key={e}
                    onClick={() => toggleEmotion(e)}
                    disabled={disabled}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      selected
                        ? "border-[#DC2626] bg-[#DC2626]/15 text-white"
                        : "border-white/10 text-[#D4D4D4] hover:border-white/30",
                      disabled && "opacity-40 cursor-not-allowed",
                    )}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-white/40 mt-2">
              {emotions.length}/4 selected
            </p>
          </Field>

          <Field
            number={3}
            prompt="Who is the single person listening?"
            help="Age + role + city archetype + 1 specific detail."
            valid={primaryAudience.trim().length >= 10}
          >
            <Input
              value={primaryAudience}
              onChange={(e) => setPrimaryAudience(e.target.value)}
              placeholder="32-year-old script supervisor in Silver Lake who runs 5 miles before coffee."
            />
            <CharCount value={primaryAudience.length} min={10} />
          </Field>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-white/40">
              We&apos;ll save these to your wiki. Continue to the full Brand Journey anytime.
            </p>
            <Button
              onClick={submit}
              disabled={!canSubmit || submitting}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {submitting ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="size-4 mr-1.5" />
              )}
              Get my first piece
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  number,
  prompt,
  help,
  valid,
  children,
}: {
  number: number;
  prompt: string;
  help: string;
  valid: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "shrink-0 size-6 rounded-full border flex items-center justify-center text-[10px] font-mono mt-0.5",
            valid
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-white/15 text-white/50",
          )}
        >
          {valid ? <Check className="size-3" /> : number}
        </div>
        <div className="flex-1">
          <Label className="text-base text-white font-medium leading-snug">
            {prompt}
          </Label>
          <p className="text-xs text-white/50 mt-0.5">{help}</p>
        </div>
      </div>
      <div className="pl-9 space-y-1.5">{children}</div>
    </div>
  );
}

function CharCount({ value, min }: { value: number; min: number }) {
  const ok = value >= min;
  return (
    <p
      className={cn(
        "text-[11px] tabular-nums",
        ok ? "text-emerald-400" : "text-white/40",
      )}
    >
      {value}/{min}+ chars
    </p>
  );
}

function ArtifactView({ artifact }: { artifact: Artifact }) {
  const [savingDraft, setSavingDraft] = useState(false);
  const copy = (label: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied.`);
    }
  };

  const saveAsDraft = async () => {
    setSavingDraft(true);
    try {
      const res = await fetch("/api/content-pieces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "instagram",
          hook: artifact.hook,
          body: artifact.caption,
          cta: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      // Navigate to the editor with the draft loaded.
      window.location.href = `/execution/draft?id=${data.piece.id}`;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
      setSavingDraft(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Link
          href="/execution"
          className="inline-flex items-center text-xs text-white/50 hover:text-white"
        >
          <ArrowLeft className="size-3 mr-1" />
          Skip to Weekly Execution
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <Flame className="size-5 text-[#DC2626]" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            Streak day 1
          </p>
        </div>
        <h1 className="text-2xl font-bold text-white">
          Here&apos;s your first piece.
        </h1>
        <p className="text-sm text-[#A3A3A3] mt-1">
          Anchored to your three answers. Copy, record, ship today. The next time you open Weekly Execution, scoring + streak tracking are live.
        </p>
      </div>

      <Card className="border-[#DC2626]/30 bg-zinc-950/60">
        <CardContent className="p-6 md:p-8 space-y-5">
          <ArtifactBlock
            label="Hook"
            value={artifact.hook}
            onCopy={() => copy("Hook", artifact.hook)}
            mono
          />
          <ArtifactBlock
            label="Caption"
            value={artifact.caption}
            onCopy={() => copy("Caption", artifact.caption)}
          />
          <div className="rounded-md border border-white/10 bg-black/30 p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-[#DC2626]">
                Post format
              </p>
              <Badge className="bg-white/5 border-white/10 text-white/70">
                {artifact.post_format.name}
              </Badge>
            </div>
            <p className="text-sm text-[#D4D4D4]">
              {artifact.post_format.structure}
            </p>
          </div>

          {artifact.reasoning && (
            <p className="text-xs text-white/40 italic pt-2 border-t border-white/5">
              Director&apos;s reasoning: {artifact.reasoning}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={saveAsDraft}
          disabled={savingDraft}
          className="inline-flex items-center gap-1.5 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white"
        >
          {savingDraft ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ArrowRight className="size-3.5" />
          )}
          Save as your first draft
        </button>
        <Link
          href="/brand"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 hover:border-white/20 px-4 py-2 text-sm text-white"
        >
          Continue to the full Brand Journey
        </Link>
      </div>
    </div>
  );
}

function ArtifactBlock({
  label,
  value,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 p-4 space-y-2 group">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-[#DC2626]">
          {label}
        </p>
        <button
          onClick={onCopy}
          className="text-xs text-white/40 hover:text-white inline-flex items-center"
        >
          <Copy className="size-3 mr-1" />
          Copy
        </button>
      </div>
      <p
        className={cn(
          "text-base leading-snug text-white",
          mono && "font-medium",
        )}
      >
        {value}
      </p>
    </div>
  );
}
