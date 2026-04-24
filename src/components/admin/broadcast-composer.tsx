"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { PLANS, type PlanId } from "@/lib/plans";

/**
 * Super-admin broadcast composer. Sends a one-off email to all paying
 * accounts (or a filtered subset by plan). Dry-run button previews recipient
 * count without hitting Resend. Bailout if recipient set > 1000.
 */

interface SendResult {
  recipients: number;
  sent?: number;
  failed?: number;
  dry_run?: boolean;
  reason?: string;
}

const PAYING_PLANS: PlanId[] = ["starter", "pro", "studio"];

export function BroadcastComposer() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [targets, setTargets] = useState<Record<PlanId, boolean>>({
    starter: true,
    pro: true,
    studio: true,
    internal: false,
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const submit = async (dryRun: boolean) => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject + body required.");
      return;
    }
    const target_plan_ids = PAYING_PLANS.filter((p) => targets[p]);
    if (target_plan_ids.length === 0) {
      toast.error("Select at least one plan.");
      return;
    }
    if (
      !dryRun &&
      !confirm(
        `Send "${subject.slice(0, 60)}" to all ${target_plan_ids.join(" + ")} accounts?`,
      )
    ) {
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          target_plan_ids,
          dry_run: dryRun,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Broadcast failed");
      setResult(data);
      if (dryRun) {
        toast.success(`Dry run: ${data.recipients} recipients.`);
      } else if (data.dry_run) {
        toast.message(`Would have sent to ${data.recipients}. ${data.reason ?? ""}`);
      } else {
        toast.success(
          `Sent ${data.sent}/${data.recipients}${data.failed ? ` · ${data.failed} failed` : ""}`,
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Broadcast failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-white/5 bg-zinc-950">
      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">
            Broadcast email
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            One-off email to paying accounts. Rendered with the FRVR Sounds
            header + an unsubscribe footer. Max 1000 recipients per send.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bcast-subject" className="text-[11px] uppercase tracking-[0.2em] text-white/50">
            Subject
          </Label>
          <Input
            id="bcast-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="A new release from FRVR Sounds"
            disabled={sending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bcast-body" className="text-[11px] uppercase tracking-[0.2em] text-white/50">
            Body
          </Label>
          <Textarea
            id="bcast-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="Plain text. Double newlines become paragraphs."
            disabled={sending}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-[0.2em] text-white/50">
            Target plans
          </Label>
          <div className="flex flex-wrap gap-3">
            {PAYING_PLANS.map((p) => (
              <label
                key={p}
                className="flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 py-1.5 cursor-pointer"
              >
                <Checkbox
                  checked={targets[p]}
                  onCheckedChange={(v) =>
                    setTargets((prev) => ({ ...prev, [p]: Boolean(v) }))
                  }
                />
                <span className="text-xs text-white">{PLANS[p].name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => submit(true)}
            disabled={sending}
            className="border-white/10 hover:bg-white/5"
          >
            {sending ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Users className="size-3.5 mr-1.5" />
            )}
            Dry run (count only)
          </Button>
          <Button
            size="sm"
            onClick={() => submit(false)}
            disabled={sending}
            className="bg-red-600 hover:bg-red-500 text-white"
          >
            {sending ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Send className="size-3.5 mr-1.5" />
            )}
            Send now
          </Button>
          {result && !sending && (
            <p className="text-[11px] text-white/60 font-mono ml-auto">
              last: {result.recipients} recipients
              {result.sent !== undefined && ` · ${result.sent} sent`}
              {result.failed !== undefined && result.failed > 0 && ` · ${result.failed} failed`}
              {result.dry_run && " · dry"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
