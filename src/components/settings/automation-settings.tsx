"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Mail, Megaphone, Send } from "lucide-react";

interface Schedule {
  id: string;
  schedule_type: "weekly_digest" | "daily_outreach_nudge" | "release_content_burst";
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
}

interface Row {
  type: Schedule["schedule_type"];
  label: string;
  hint: string;
  icon: typeof Mail;
  status: "live" | "soon";
}

const ROWS: Row[] = [
  {
    type: "weekly_digest",
    label: "Weekly digest email",
    hint: "Mondays at 09:00 UTC. Your last 7 days of songs, submissions, and agent runs.",
    icon: Mail,
    status: "live",
  },
  {
    type: "daily_outreach_nudge",
    label: "Daily outreach nudge",
    hint: "Pings you about approved outreach drafts that haven't been sent.",
    icon: Send,
    status: "soon",
  },
  {
    type: "release_content_burst",
    label: "Release content burst",
    hint: "Fans a new release into a content moment set the day it ships.",
    icon: Megaphone,
    status: "soon",
  },
];

export function AutomationSettings() {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/me/automation-schedules");
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? "Failed to load");
      setSchedules(data.schedules ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (type: Schedule["schedule_type"], enabled: boolean) => {
    setUpdating(type);
    try {
      const r = await fetch("/api/me/automation-schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule_type: type, enabled }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? "Update failed");
      setSchedules((prev) => {
        const without = prev.filter((s) => s.schedule_type !== type);
        return data.schedule ? [...without, data.schedule] : without;
      });
      toast.success(enabled ? "Enabled." : "Disabled.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Card className="border-white/5 bg-zinc-950">
      <CardHeader>
        <CardTitle className="text-white">Automations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </>
        ) : (
          ROWS.map((row) => {
            const current = schedules.find((s) => s.schedule_type === row.type);
            const enabled = current?.enabled ?? false;
            const Icon = row.icon;
            const isSoon = row.status === "soon";
            return (
              <div
                key={row.type}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.01] p-3"
              >
                <Icon
                  className={`size-4 mt-0.5 shrink-0 ${isSoon ? "text-white/30" : "text-red-400"}`}
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white leading-tight">
                      {row.label}
                    </p>
                    {isSoon && (
                      <span className="text-[9px] uppercase tracking-wider text-white/30">
                        coming soon
                      </span>
                    )}
                    {!isSoon && current?.next_run_at && enabled && (
                      <span className="text-[10px] text-white/40 font-mono">
                        next: {formatNext(current.next_run_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/50 leading-snug">
                    {row.hint}
                  </p>
                </div>
                <Switch
                  checked={enabled}
                  disabled={isSoon || updating === row.type}
                  onCheckedChange={(v) => toggle(row.type, v)}
                />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function formatNext(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
