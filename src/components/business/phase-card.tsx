"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { BusinessSetup } from "@/types/business-setup";

interface PhaseCardProps {
  number: number;
  title: string;
  description: string;
  progress: number;
  setup: BusinessSetup;
  onChange: (field: string, value: unknown) => void;
}

interface TaskDef {
  key: string;
  label: string;
  helpText: string;
  type: "boolean" | "select" | "text" | "number" | "array";
  options?: { value: string; label: string }[];
  relatedFields?: { key: string; label: string; placeholder: string }[];
}

const PHASE_TASKS: Record<number, TaskDef[]> = {
  1: [
    {
      key: "artist_name_chosen",
      label: "Artist name chosen",
      helpText: "Your official artist/brand name",
      type: "boolean",
    },
    {
      key: "genre_defined",
      label: "Genre defined",
      helpText: "Your primary genre(s) for sync targeting",
      type: "boolean",
    },
    {
      key: "goals_defined",
      label: "Goals defined",
      helpText: "What type of placements are you going for?",
      type: "boolean",
    },
    {
      key: "email_professional",
      label: "Professional email",
      helpText:
        "A dedicated email for music business (not personal)",
      type: "boolean",
    },
    {
      key: "social_handles_secured",
      label: "Social handles secured",
      helpText:
        "Same name across Instagram, TikTok, YouTube, etc.",
      type: "boolean",
    },
  ],
  2: [
    {
      key: "llc_status",
      label: "LLC status",
      helpText:
        "An LLC protects your personal assets. Costs $50-$500 depending on state. Services like LegalZoom or your state's website work fine.",
      type: "select",
      options: [
        { value: "not_started", label: "Not Started" },
        { value: "researching", label: "Researching" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
        { value: "not_needed", label: "Not Needed" },
      ],
      relatedFields: [
        { key: "llc_state", label: "State", placeholder: "e.g. California" },
        {
          key: "llc_service",
          label: "Service used",
          placeholder: "e.g. LegalZoom",
        },
      ],
    },
    {
      key: "ein_obtained",
      label: "EIN obtained",
      helpText:
        "Your business tax ID number. Free from IRS.gov. Takes 5 minutes online.",
      type: "boolean",
    },
    {
      key: "business_bank_account",
      label: "Business bank account",
      helpText:
        "Separate your music money from personal. Most banks offer free business checking.",
      type: "boolean",
    },
    {
      key: "pro_registered",
      label: "PRO registered",
      helpText:
        "A PRO collects royalties when your music plays on TV, radio, or in public. ASCAP and BMI are free to join.",
      type: "boolean",
      relatedFields: [
        {
          key: "pro_name",
          label: "PRO name",
          placeholder: "ASCAP, BMI, or SESAC",
        },
      ],
    },
    {
      key: "publisher_setup",
      label: "Publisher setup",
      helpText:
        "Publishing = getting paid when your songs are used. You can self-publish or sign with a publisher.",
      type: "boolean",
      relatedFields: [
        {
          key: "publisher_name",
          label: "Publisher name",
          placeholder: "e.g. Self-published",
        },
      ],
    },
    {
      key: "admin_deal",
      label: "Admin deal",
      helpText:
        "An admin publisher handles the paperwork of collecting your royalties worldwide. Songtrust, TuneCore Publishing, CD Baby Pro are popular options.",
      type: "boolean",
      relatedFields: [
        {
          key: "admin_company",
          label: "Admin company",
          placeholder: "e.g. Songtrust",
        },
      ],
    },
  ],
  3: [
    {
      key: "daw_chosen",
      label: "DAW chosen",
      helpText:
        "Your Digital Audio Workstation. Logic Pro, Ableton, FL Studio are the big three.",
      type: "text",
    },
    {
      key: "home_studio_setup",
      label: "Home studio set up",
      helpText:
        "Even a basic setup helps. Laptop + DAW + headphones is enough to start.",
      type: "boolean",
    },
    {
      key: "file_organization_system",
      label: "File organization system",
      helpText:
        "Consistent folder structure for all your sessions and exports.",
      type: "boolean",
    },
    {
      key: "naming_convention_set",
      label: "Naming convention set",
      helpText:
        "How you name files: ArtistName_SongTitle_Version_Date",
      type: "boolean",
    },
    {
      key: "metadata_template_created",
      label: "Metadata template created",
      helpText:
        "A template you fill out for every song (genre, mood, BPM, key, etc.)",
      type: "boolean",
    },
    {
      key: "backup_system",
      label: "Backup system",
      helpText: "External drive + cloud backup. Never lose a session.",
      type: "boolean",
    },
  ],
  4: [
    {
      key: "sync_ready_tracks",
      label: "Sync-ready tracks",
      helpText:
        "How many tracks are fully ready for sync (metadata, stems, scored)?",
      type: "number",
    },
    {
      key: "library_accounts",
      label: "Library accounts",
      helpText:
        "Sync libraries you're registered with (Musicbed, Artlist, Songtradr, etc.)",
      type: "array",
    },
    {
      key: "distribution_setup",
      label: "Distribution setup",
      helpText:
        "DistroKid, TuneCore, CD Baby -- gets your music on Spotify, Apple Music, etc.",
      type: "boolean",
      relatedFields: [
        {
          key: "distributor_name",
          label: "Distributor",
          placeholder: "e.g. DistroKid",
        },
      ],
    },
    {
      key: "website_live",
      label: "Website live",
      helpText:
        "Even a simple one-page site with your bio, music, and contact.",
      type: "boolean",
    },
    {
      key: "epk_created",
      label: "EPK created",
      helpText:
        "Electronic Press Kit -- your professional one-sheet for music supervisors.",
      type: "boolean",
    },
  ],
};

const PHASE_COLORS: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-purple-500",
  3: "bg-amber-500",
  4: "bg-emerald-500",
};

export function PhaseCard({
  number,
  title,
  description,
  progress,
  setup,
  onChange,
}: PhaseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);
  const tasks = PHASE_TASKS[number] || [];

  const completedCount = tasks.filter((t) => {
    const val = setup[t.key as keyof BusinessSetup];
    if (typeof val === "boolean") return val;
    if (t.key === "llc_status")
      return val === "completed" || val === "not_needed";
    if (t.type === "text") return !!val;
    if (t.type === "number") return (val as number) > 0;
    return false;
  }).length;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center size-8 rounded-full text-sm font-bold text-white",
                PHASE_COLORS[number]
              )}
            >
              {number}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-xs text-[#A3A3A3] mt-0.5">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#A3A3A3] tabular-nums">
              {completedCount}/{tasks.length}
            </span>
            {expanded ? (
              <ChevronUp className="size-4 text-[#555]" />
            ) : (
              <ChevronDown className="size-4 text-[#555]" />
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-[#1A1A1A]">
          <div
            className={cn("h-full rounded-full transition-all", PHASE_COLORS[number])}
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-1">
          {tasks.map((task) => {
            const value = setup[task.key as keyof BusinessSetup];
            const isCompleted =
              task.type === "boolean"
                ? !!value
                : task.key === "llc_status"
                  ? value === "completed" || value === "not_needed"
                  : task.type === "text"
                    ? !!value
                    : task.type === "number"
                      ? (value as number) > 0
                      : false;

            return (
              <div
                key={task.key}
                className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isCompleted ? (
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="size-4 text-[#333] shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isCompleted ? "text-white" : "text-[#A3A3A3]"
                      )}
                    >
                      {task.label}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedHelp(
                          expandedHelp === task.key ? null : task.key
                        );
                      }}
                      className="text-[#555] hover:text-[#A3A3A3] transition-colors"
                    >
                      <HelpCircle className="size-3.5" />
                    </button>
                  </div>

                  {/* Control */}
                  <div className="shrink-0 ml-2">
                    {task.type === "boolean" && (
                      <Switch
                        checked={!!value}
                        onCheckedChange={(checked) =>
                          onChange(task.key, !!checked)
                        }
                      />
                    )}
                    {task.type === "select" && (
                      <Select
                        value={(value as string) || "not_started"}
                        onValueChange={(val) => onChange(task.key, val)}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {task.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {task.type === "text" && (
                      <Input
                        value={(value as string) || ""}
                        onChange={(e) => onChange(task.key, e.target.value)}
                        placeholder="Enter..."
                        className="w-[160px] h-8 text-xs"
                      />
                    )}
                    {task.type === "number" && (
                      <Input
                        type="number"
                        value={(value as number) || 0}
                        onChange={(e) =>
                          onChange(task.key, parseInt(e.target.value) || 0)
                        }
                        min={0}
                        className="w-[80px] h-8 text-xs"
                      />
                    )}
                    {task.type === "array" && (
                      <Input
                        value={
                          Array.isArray(value) ? (value as string[]).join(", ") : ""
                        }
                        onChange={(e) =>
                          onChange(
                            task.key,
                            e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          )
                        }
                        placeholder="Comma-separated..."
                        className="w-[200px] h-8 text-xs"
                      />
                    )}
                  </div>
                </div>

                {/* Help text */}
                {expandedHelp === task.key && (
                  <p className="mt-2 text-xs text-[#777] pl-6">
                    {task.helpText}
                  </p>
                )}

                {/* Related fields */}
                {task.relatedFields && isCompleted && (
                  <div className="mt-2 pl-6 flex flex-wrap gap-2">
                    {task.relatedFields.map((rf) => (
                      <div key={rf.key} className="flex items-center gap-1.5">
                        <span className="text-xs text-[#555]">{rf.label}:</span>
                        <Input
                          value={
                            (setup[rf.key as keyof BusinessSetup] as string) ||
                            ""
                          }
                          onChange={(e) => onChange(rf.key, e.target.value)}
                          placeholder={rf.placeholder}
                          className="w-[150px] h-7 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* LLC Guide link for LLC status task */}
                {task.key === "llc_status" && (
                  <div className="mt-2 pl-6">
                    <Link
                      href="/business/llc"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E87420] hover:text-[#E87420]/80 transition-colors"
                    >
                      Open LLC Guide
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
