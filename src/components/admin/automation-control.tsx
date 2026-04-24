"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Zap } from "lucide-react";
import { toast } from "sonner";

interface TickResult {
  ok: boolean;
  scheduled?: number;
  attempted?: number;
  completed?: number;
  failed?: number;
  error?: string;
}

export function AutomationControl() {
  const [running, setRunning] = useState(false);
  const [last, setLast] = useState<TickResult | null>(null);

  const run = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/automation/tick", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as TickResult;
      setLast(data);
      if (!data.ok) {
        toast.error(data.error ?? "Tick failed");
      } else {
        toast.success(
          `Tick: +${data.scheduled ?? 0} scheduled · ${data.completed ?? 0}/${data.attempted ?? 0} completed`,
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tick failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="border-white/5 bg-zinc-950">
      <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-red-500/10 p-2 border border-red-500/30">
            <Zap className="size-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              Automation · daily cron
            </p>
            <p className="text-[11px] text-white/50 leading-snug">
              Walks enabled schedules + runs pending jobs. Vercel Cron hits
              this daily at 09:00 UTC.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {last && last.ok && (
            <p className="text-[11px] text-white/60 font-mono">
              last: +{last.scheduled ?? 0} sched · {last.completed ?? 0}/
              {last.attempted ?? 0} done
              {last.failed && last.failed > 0 ? ` · ${last.failed} fail` : ""}
            </p>
          )}
          <Button
            size="sm"
            onClick={run}
            disabled={running}
            className="bg-red-600 hover:bg-red-500 text-white"
          >
            {running ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Play className="size-3.5 mr-1.5" />
            )}
            {running ? "Running…" : "Run tick now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
