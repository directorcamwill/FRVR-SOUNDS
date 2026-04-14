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
  CheckCircle2,
  Circle,
  ArrowRight,
  Piano,
  Sliders,
  Flame,
  DollarSign,
  Gift,
  Mic,
  Headphones,
  Speaker,
  Zap,
  Folder,
  FolderOpen,
  FileText,
  FileCheck,
  HardDrive,
  Cloud,
  Database,
  Check,
  Lightbulb,
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
  guide?: { title: string; lines: { icon?: string; text: string; indent?: boolean }[]; tip: string };
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
      helpText: "Your Digital Audio Workstation — this is where you make music.",
      type: "text",
      guide: {
        title: "Which DAW should I use?",
        lines: [
          { icon: "piano", text: "Logic Pro ($200 one-time) — Best for Mac users. Industry standard for songwriting and production." },
          { icon: "sliders", text: "Ableton Live ($99-$749) — Best for electronic, beat-making, and live performance. Unique workflow." },
          { icon: "flame", text: "FL Studio ($99-$499) — Best for hip-hop and trap. Free lifetime updates. Works on Mac and PC." },
          { icon: "dollar", text: "Reaper ($60) — Budget-friendly, powerful, fully customizable. Great if you're starting out." },
          { icon: "gift", text: "GarageBand (Free on Mac) — Perfect starting point. Upgrade to Logic Pro later." },
        ],
        tip: "Pick ONE and learn it deeply. The DAW doesn't make the music — you do. Don't switch around."
      },
    },
    {
      key: "home_studio_setup",
      label: "Home studio set up",
      helpText: "Your creative space. Doesn't need to be fancy — just functional.",
      type: "boolean",
      guide: {
        title: "What do I actually need?",
        lines: [
          { icon: "headphones", text: "Minimum setup ($200-$400): Laptop + DAW + decent headphones (Audio-Technica ATH-M50x ~$150)" },
          { icon: "mic", text: "Recording setup ($400-$800): Add an audio interface (Focusrite Scarlett Solo ~$120) + condenser mic (AT2020 ~$100)" },
          { icon: "speaker", text: "Mixing setup ($800-$1500): Add studio monitors (Yamaha HS5 ~$400/pair) + basic acoustic treatment ($100-$300)" },
          { icon: "zap", text: "Priority order: Headphones, then Interface, then Mic, then Monitors, then Treatment" },
        ],
        tip: "Start with headphones you trust. Everything else can come later. Many hit songs were made on laptops with headphones."
      },
    },
    {
      key: "file_organization_system",
      label: "File organization system",
      helpText: "Never lose a session again. Set this up once, use it forever.",
      type: "boolean",
      guide: {
        title: "Recommended folder structure",
        lines: [
          { icon: "folder", text: "Music/" },
          { icon: "folderOpen", text: "Projects/ (active DAW sessions)", indent: true },
          { icon: "folderOpen", text: "Exports/ (bounced files ready to use)", indent: true },
          { icon: "folder", text: "Masters/", indent: true },
          { icon: "folder", text: "Stems/", indent: true },
          { icon: "folder", text: "Instrumentals/", indent: true },
          { icon: "folderOpen", text: "Samples/ (your sample library)", indent: true },
          { icon: "folderOpen", text: "References/ (songs you reference)", indent: true },
          { icon: "folderOpen", text: "Sync-Ready/ (final deliverables for sync)", indent: true },
        ],
        tip: "Create this folder structure now. Drag your existing files in. Takes 15 minutes and saves you hours."
      },
    },
    {
      key: "naming_convention_set",
      label: "Naming convention set",
      helpText: "Consistent file names = professional. Music supervisors notice this.",
      type: "boolean",
      guide: {
        title: "Naming convention template",
        lines: [
          { icon: "fileText", text: "Song files: ArtistName_SongTitle_Master.wav" },
          { icon: "fileText", text: "Stems: ArtistName_SongTitle_Vocals.wav" },
          { icon: "fileText", text: "Instrumentals: ArtistName_SongTitle_Instrumental.wav" },
          { icon: "fileText", text: "Alt versions: ArtistName_SongTitle_30sec.wav" },
          { icon: "fileText", text: "Projects: SongTitle_v1_2026-04-13" },
          { icon: "fileCheck", text: "FRVR_OutOfTime_Master.wav", indent: true },
          { icon: "fileCheck", text: "FRVR_OutOfTime_Vocals.wav", indent: true },
          { icon: "fileCheck", text: "FRVR_OutOfTime_Instrumental.wav", indent: true },
          { icon: "fileCheck", text: "FRVR_OutOfTime_30sec.wav", indent: true },
        ],
        tip: "No spaces in file names. Use underscores. Always include your artist name. This is how professionals do it."
      },
    },
    {
      key: "metadata_template_created",
      label: "Metadata template created",
      helpText: "Fill this out for every song. It's required for sync licensing.",
      type: "boolean",
      guide: {
        title: "Metadata checklist for every song",
        lines: [
          { icon: "check", text: "Title" },
          { icon: "check", text: "Artist / Composer name" },
          { icon: "check", text: "Genre + Sub-genre" },
          { icon: "check", text: "Mood tags (3-5)" },
          { icon: "check", text: "BPM" },
          { icon: "check", text: "Key" },
          { icon: "check", text: "Duration" },
          { icon: "check", text: "Lyrics (if applicable)" },
          { icon: "check", text: "Explicit: Yes/No" },
          { icon: "check", text: "Instrumental available: Yes/No" },
          { icon: "check", text: "One-stop licensing: Yes/No" },
          { icon: "check", text: "PRO info (ASCAP/BMI + IPI#)" },
          { icon: "check", text: "Publisher info" },
          { icon: "check", text: "ISRC code (from your distributor)" },
        ],
        tip: "Good news — the Song Vault in FRVR SOUNDS handles all of this for you. Just fill in the fields when you upload a track."
      },
    },
    {
      key: "backup_system",
      label: "Backup system",
      helpText: "If your hard drive dies tomorrow, do you lose everything?",
      type: "boolean",
      guide: {
        title: "The 3-2-1 backup rule",
        lines: [
          { icon: "database", text: "Keep 3 copies of your files" },
          { icon: "hardDrive", text: "On 2 different types of storage" },
          { icon: "cloud", text: "With 1 copy offsite (cloud)" },
          { icon: "cloud", text: "Option 1 (Free): Google Drive / iCloud — sync your Music folder", indent: true },
          { icon: "cloud", text: "Option 2 ($6/mo): Backblaze — backs up your entire computer automatically", indent: true },
          { icon: "hardDrive", text: "Option 3 ($60 one-time): External hard drive — clone your Music folder weekly", indent: true },
          { icon: "zap", text: "Best combo: External drive + cloud backup = bulletproof" },
        ],
        tip: "Set up automatic cloud backup TODAY. It takes 5 minutes. You'll thank yourself when something inevitably goes wrong."
      },
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

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  piano: Piano,
  sliders: Sliders,
  flame: Flame,
  dollar: DollarSign,
  gift: Gift,
  mic: Mic,
  headphones: Headphones,
  speaker: Speaker,
  zap: Zap,
  folder: Folder,
  folderOpen: FolderOpen,
  fileText: FileText,
  fileCheck: FileCheck,
  check: Check,
  hardDrive: HardDrive,
  cloud: Cloud,
  database: Database,
};

function GuideIcon({ name, index }: { name?: string; index: number }) {
  const Icon = name ? ICON_MAP[name] : null;
  if (!Icon) return <div className="size-4 shrink-0" />;
  return (
    <div
      className="shrink-0 animate-[fadeSlideIn_0.3s_ease_forwards] opacity-0"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Icon className="size-4 text-[#DC2626] transition-transform duration-200 group-hover:scale-110" />
    </div>
  );
}

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
            const isExpanded = expandedHelp === task.key;
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
                className={cn(
                  "rounded-xl border transition-all duration-200 overflow-hidden",
                  isExpanded
                    ? "border-[#DC2626]/40 bg-gradient-to-b from-[#111] to-[#0A0A0A] shadow-lg shadow-[#DC2626]/5"
                    : isCompleted
                      ? "border-emerald-500/20 bg-black"
                      : "border-[#1A1A1A] bg-black hover:border-[#333]"
                )}
              >
                {/* Clickable header — click to expand */}
                <button
                  type="button"
                  onClick={() => setExpandedHelp(isExpanded ? null : task.key)}
                  className="w-full text-left p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "size-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isExpanded
                          ? "bg-[#DC2626] text-white"
                          : "bg-[#1A1A1A] text-[#555] border border-[#333]"
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <Circle className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className={cn(
                        "text-sm font-semibold block",
                        isCompleted ? "text-emerald-400" : isExpanded ? "text-white" : "text-[#A3A3A3]"
                      )}>
                        {task.label}
                      </span>
                      <span className="text-[11px] text-[#555] block mt-0.5">
                        {task.helpText}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Quick status */}
                    {isCompleted && !isExpanded && (
                      <span className="text-[10px] text-emerald-400 font-medium">Done</span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-[#DC2626]" />
                    ) : (
                      <ChevronDown className="size-4 text-[#555]" />
                    )}
                  </div>
                </button>

                {/* Expanded content — the interactive part */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    {/* Divider */}
                    <div className="h-px bg-[#1A1A1A]" />

                    {/* Control section */}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-[#777]">
                        {task.type === "boolean" ? "Mark as completed:" :
                         task.type === "text" ? "Enter your choice:" :
                         task.type === "select" ? "Current status:" :
                         task.type === "number" ? "How many?" :
                         "Enter values:"}
                      </span>
                      <div>
                        {task.type === "boolean" && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); onChange(task.key, true); }}
                              className={cn(
                                "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                                isCompleted
                                  ? "bg-emerald-500 text-white"
                                  : "bg-[#1A1A1A] text-[#A3A3A3] border border-[#333] hover:border-emerald-500 hover:text-emerald-400"
                              )}
                            >
                              {isCompleted ? "✓ Done" : "Mark Done"}
                            </button>
                            {isCompleted && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onChange(task.key, false); }}
                                className="px-3 py-2 rounded-lg text-xs text-[#555] hover:text-red-400 border border-[#1A1A1A] hover:border-red-500/30 transition-all"
                              >
                                Undo
                              </button>
                            )}
                          </div>
                        )}
                        {task.type === "select" && (
                          <Select
                            value={(value as string) || "not_started"}
                            onValueChange={(val) => onChange(task.key, val)}
                          >
                            <SelectTrigger className="w-[160px] h-9 text-xs">
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
                            placeholder="Type here..."
                            className="w-[200px] h-9 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {task.type === "number" && (
                          <Input
                            type="number"
                            value={(value as number) || 0}
                            onChange={(e) => onChange(task.key, parseInt(e.target.value) || 0)}
                            min={0}
                            className="w-[100px] h-9 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {task.type === "array" && (
                          <Input
                            value={Array.isArray(value) ? (value as string[]).join(", ") : ""}
                            onChange={(e) => onChange(task.key, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                            placeholder="Comma-separated..."
                            className="w-[240px] h-9 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </div>
                    </div>

                    {/* Related fields */}
                    {task.relatedFields && (
                      <div className="space-y-2">
                        {task.relatedFields.map((rf) => (
                          <div key={rf.key} className="flex items-center gap-3">
                            <span className="text-xs text-[#777] w-24 shrink-0">{rf.label}</span>
                            <Input
                              value={(setup[rf.key as keyof BusinessSetup] as string) || ""}
                              onChange={(e) => onChange(rf.key, e.target.value)}
                              placeholder={rf.placeholder}
                              className="flex-1 h-9 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Guide content */}
                    {task.guide && (
                      <div className="rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] p-4 space-y-3">
                        <p className="text-sm font-semibold text-[#DC2626]">
                          {task.guide.title}
                        </p>
                        <div className="space-y-2">
                          {task.guide.lines.map((line, i) => (
                            <div
                              key={i}
                              className={cn(
                                "flex items-start gap-2.5 group",
                                line.indent && "pl-6"
                              )}
                              style={{ animationDelay: `${i * 60}ms` }}
                            >
                              <GuideIcon name={line.icon} index={i} />
                              <span className="text-xs text-[#A3A3A3] leading-relaxed pt-0.5">
                                {line.text}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 p-3 flex items-start gap-2.5">
                          <Lightbulb className="size-4 text-[#DC2626] shrink-0 animate-pulse" />
                          <p className="text-xs text-[#DC2626] font-medium">
                            {task.guide.tip}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* LLC Guide link */}
                    {task.key === "llc_status" && (
                      <Link
                        href="/business/llc"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 text-sm font-medium text-[#DC2626] hover:bg-[#DC2626]/20 transition-all"
                      >
                        Open Full LLC Setup Guide
                        <ArrowRight className="size-4" />
                      </Link>
                    )}
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
