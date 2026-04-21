"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfidencePill } from "@/components/ui/motion";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Sliders,
  PenTool,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowDownToDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * GuidancePanel — three agent-driven cards (Producer / Songwriter / Collab)
 * sharing the same render pattern. Shown on the song-lab project detail page's
 * right column. Each card: button fires the agent, renders cached guidance
 * when present, shows gate message if brand_wiki < 60%.
 */

export type AgentKey = "producer" | "songwriter" | "collab";

interface GuidancePanelProps {
  projectId: string;
  initial: {
    producer_guidance?: Record<string, unknown> | null;
    producer_guidance_at?: string | null;
    songwriter_guidance?: Record<string, unknown> | null;
    songwriter_guidance_at?: string | null;
    collab_suggestions?: Record<string, unknown> | null;
    collab_suggestions_at?: string | null;
  };
  onApplyToProject?: (
    kind: AgentKey,
    guidance: Record<string, unknown>
  ) => void | Promise<void>;
  // Called after any agent's POST resolves. Parent should silently refetch
  // the project so cached guidance + timestamps come from DB truth, not the
  // response body. Fixes the "client state didn't update" class of bugs.
  onAgentComplete?: () => void | Promise<void>;
}

export function GuidancePanel({
  projectId,
  initial,
  onApplyToProject,
  onAgentComplete,
}: GuidancePanelProps) {
  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="size-4 text-red-500" />
          AI Guidance
        </h3>
        <p className="text-[11px] text-[#A3A3A3]">
          Brand-aware guidance from your Brand Wiki. Requires wiki ≥ 60%.
        </p>

        <AgentCard
          kind="producer"
          label="Producer"
          icon={Sliders}
          projectId={projectId}
          initial={initial.producer_guidance ?? null}
          initialAt={initial.producer_guidance_at ?? null}
          onApplyToProject={onApplyToProject}
          onAgentComplete={onAgentComplete}
        />
        <AgentCard
          kind="songwriter"
          label="Songwriter"
          icon={PenTool}
          projectId={projectId}
          initial={initial.songwriter_guidance ?? null}
          initialAt={initial.songwriter_guidance_at ?? null}
          onApplyToProject={onApplyToProject}
          onAgentComplete={onAgentComplete}
        />
        <AgentCard
          kind="collab"
          label="Collab"
          icon={Users}
          projectId={projectId}
          initial={initial.collab_suggestions ?? null}
          initialAt={initial.collab_suggestions_at ?? null}
          onApplyToProject={onApplyToProject}
          onAgentComplete={onAgentComplete}
        />
      </CardContent>
    </Card>
  );
}

function AgentCard({
  kind,
  label,
  icon: Icon,
  projectId,
  initial,
  initialAt,
  onApplyToProject,
  onAgentComplete,
}: {
  kind: AgentKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  projectId: string;
  initial: Record<string, unknown> | null;
  initialAt: string | null;
  onApplyToProject?: (
    kind: AgentKey,
    guidance: Record<string, unknown>
  ) => void | Promise<void>;
  onAgentComplete?: () => void | Promise<void>;
}) {
  const [guidance, setGuidance] = useState<Record<string, unknown> | null>(
    initial
  );
  const [lastRunAt, setLastRunAt] = useState<string | null>(initialAt);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [gateMessage, setGateMessage] = useState<string | null>(null);

  // Re-sync local state when the parent's refetched data arrives. The card
  // owns optimistic state during a run, but once the parent has DB truth we
  // let it win — avoids stale client state if the POST response body is
  // partial, truncated, or differs from what actually persisted.
  useEffect(() => {
    setGuidance(initial);
    setLastRunAt(initialAt);
  }, [initial, initialAt]);

  const run = async () => {
    setLoading(true);
    setGateMessage(null);
    try {
      const res = await fetch(`/api/agents/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      if (res.status === 422 && data?.gated) {
        setGateMessage(data.message);
        return;
      }
      if (!res.ok) throw new Error(data?.error || `${label} failed`);
      setGuidance(data.guidance);
      setLastRunAt(new Date().toISOString());
      setExpanded(true);
      toast.success(`${label} guidance refreshed`);
      await onAgentComplete?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${label} failed`);
    } finally {
      setLoading(false);
    }
  };

  const confidence =
    guidance &&
    typeof guidance.confidence === "number" &&
    Number.isFinite(guidance.confidence as number)
      ? (guidance.confidence as number)
      : null;

  return (
    <div className="rounded-lg border border-[#1A1A1A] overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="size-3.5 text-[#A3A3A3] shrink-0" />
            <span className="text-sm font-medium text-white truncate">{label}</span>
            {confidence != null && (
              <ConfidencePill score={confidence} showLabel={false} />
            )}
          </div>
          {lastRunAt && (
            <span className="text-[9px] uppercase tracking-wider text-[#555] pl-5">
              Updated {new Date(lastRunAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {guidance && onApplyToProject && (
            <button
              onClick={async () => {
                await onApplyToProject(kind, guidance);
                toast.success(`${label} applied to Idea`);
              }}
              className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-red-400 hover:text-red-300 px-1.5"
              title="Write relevant fields into the project"
            >
              <ArrowDownToDot className="size-3" />
              Apply
            </button>
          )}
          {guidance && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-[#A3A3A3] hover:text-white"
              aria-label={expanded ? "collapse" : "expand"}
            >
              {expanded ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
          )}
          <Button
            size="sm"
            variant={guidance ? "outline" : "default"}
            onClick={run}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : guidance ? (
              "Re-run"
            ) : (
              "Run"
            )}
          </Button>
        </div>
      </div>

      {gateMessage && (
        <div className="px-3 pb-3">
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] text-amber-200">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
            <div>
              <p>{gateMessage}</p>
              <Link
                href="/brand"
                className="underline underline-offset-2 hover:text-amber-100"
              >
                Open Brand Wiki →
              </Link>
            </div>
          </div>
        </div>
      )}

      {guidance && expanded && (
        <div
          className={cn(
            "border-t border-[#1A1A1A] px-3 py-2 text-[11px] leading-relaxed",
            "max-h-80 overflow-y-auto"
          )}
        >
          <GuidanceView guidance={guidance} />
        </div>
      )}
    </div>
  );
}

// Shape-agnostic renderer — these are LLM-emitted JSON objects with deep,
// variable shapes. Rather than bake a renderer per agent, we walk the object
// and render sections with sensible typography. Users get full detail; we
// avoid schema coupling.
function GuidanceView({ guidance }: { guidance: Record<string, unknown> }) {
  const entries = Object.entries(guidance).filter(
    ([k]) =>
      k !== "confidence" && k !== "reasoning" && k !== "generated_at" && k !== "model_used"
  );
  return (
    <div className="space-y-3">
      {typeof guidance.reasoning === "string" && guidance.reasoning.length > 0 && (
        <p className="italic text-[#8892a4]">{guidance.reasoning as string}</p>
      )}
      {entries.map(([key, value]) => (
        <Section key={key} title={key} value={value} />
      ))}
    </div>
  );
}

function Section({ title, value }: { title: string; value: unknown }) {
  const prettyTitle = title.replace(/_/g, " ");
  if (value == null) return null;
  if (typeof value === "string") {
    return (
      <div>
        <p className="text-[9px] uppercase tracking-wider text-[#8892a4] mb-0.5">
          {prettyTitle}
        </p>
        <p className="text-[#D4D4D4] whitespace-pre-line">{value}</p>
      </div>
    );
  }
  if (typeof value === "number") {
    return (
      <div>
        <p className="text-[9px] uppercase tracking-wider text-[#8892a4] mb-0.5">
          {prettyTitle}
        </p>
        <p className="text-white tabular-nums">{value}</p>
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <div>
        <p className="text-[9px] uppercase tracking-wider text-[#8892a4] mb-1">
          {prettyTitle}
        </p>
        <ul className="space-y-1.5">
          {value.map((item, i) => (
            <li key={i} className="text-[#D4D4D4]">
              {typeof item === "string" ? (
                <span>• {item}</span>
              ) : typeof item === "object" && item !== null ? (
                <ObjectRow row={item as Record<string, unknown>} />
              ) : (
                String(item)
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (typeof value === "object") {
    return (
      <div>
        <p className="text-[9px] uppercase tracking-wider text-[#8892a4] mb-1">
          {prettyTitle}
        </p>
        <div className="pl-2 border-l border-[#1A1A1A] space-y-1">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="text-[#D4D4D4]">
              <span className="text-[#8892a4]">{k.replace(/_/g, " ")}: </span>
              <span>
                {typeof v === "string" || typeof v === "number"
                  ? String(v)
                  : Array.isArray(v)
                    ? (v as unknown[]).join(", ")
                    : JSON.stringify(v)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function ObjectRow({ row }: { row: Record<string, unknown> }) {
  const entries = Object.entries(row);
  return (
    <div className="border-l border-[#1A1A1A] pl-2">
      {entries.map(([k, v]) => (
        <div key={k}>
          <span className="text-[#8892a4] text-[10px] uppercase tracking-wider">
            {k.replace(/_/g, " ")}:{" "}
          </span>
          <span className="text-[#D4D4D4]">
            {typeof v === "string" || typeof v === "number"
              ? String(v)
              : Array.isArray(v)
                ? (v as unknown[]).join(", ")
                : JSON.stringify(v)}
          </span>
        </div>
      ))}
    </div>
  );
}
