"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  Check,
  Link2,
  Link2Off,
  Loader2,
  Music,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GuidancePanel, type AgentKey } from "@/components/song-lab/guidance-panel";
import { OpportunityScanner } from "@/components/song-lab/opportunity-scanner";
import { BrandFitPanel } from "@/components/vault/brand-fit-panel";
import type { BrandFitStatusSummary } from "@/types/song";

interface SongLabProject {
  id: string;
  title: string;
  status: string;
  bpm: number | null;
  key: string | null;
  genre: string | null;
  mood: string | null;
  lyrics: string | null;
  notes: string | null;
  structure: string | null;
  reference_tracks: string[];
  checklist: ChecklistItem[];
  song_id: string | null;
  created_at: string;
  updated_at: string;
  // AI guidance cache (migration 00015)
  producer_guidance?: Record<string, unknown> | null;
  producer_guidance_at?: string | null;
  songwriter_guidance?: Record<string, unknown> | null;
  songwriter_guidance_at?: string | null;
  collab_suggestions?: Record<string, unknown> | null;
  collab_suggestions_at?: string | null;
  // Tabbed workspace fields (migration 00017)
  writing_ideas?: string | null;
  producer_ideas?: string | null;
  metaphors?: string | null;
  brand_connection?: string | null;
  project_mode?: "single" | "album" | null;
  placement_intent?: "sync" | "brand_release" | "both" | null;
  album_context?: {
    album_title?: string;
    song_position?: number;
    concept?: string;
  } | null;
}

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

interface LinkableSong {
  id: string;
  title: string;
  status: string | null;
  created_at: string;
  song_metadata?:
    | { genre: string | null; moods: string[] | null; bpm: number | null; key: string | null }
    | Array<{ genre: string | null; moods: string[] | null; bpm: number | null; key: string | null }>
    | null;
}

// Fetches the linked vault song's brand-fit cache and renders a read-only
// BrandFitPanel on song-lab. Song-lab stays a consumer of vault truth — no
// duplicate brand-fit state.
function LinkedSongBrandFit({ songId }: { songId: string | null }) {
  const [status, setStatus] = useState<BrandFitStatusSummary | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!songId) return;
    (async () => {
      try {
        const res = await fetch(`/api/songs/${songId}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.brand_fit_status ?? null);
          setCheckedAt(data.brand_fit_checked_at ?? null);
        }
      } catch {
        // ignore
      } finally {
        setLoaded(true);
      }
    })();
  }, [songId]);

  if (!songId) {
    return (
      <Card>
        <CardContent className="py-4 space-y-2">
          <h3 className="text-sm font-semibold text-white">Brand Fit</h3>
          <p className="text-xs text-[#A3A3A3]">
            Promote this project to the vault to enable Brand Fit grading.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!loaded) {
    return (
      <Card>
        <CardContent className="py-4 space-y-2">
          <h3 className="text-sm font-semibold text-white">Brand Fit</h3>
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <BrandFitPanel
      songId={songId}
      initialStatus={status}
      initialCheckedAt={checkedAt}
      readOnly
      linkToVault
    />
  );
}

const stages = [
  "idea",
  "writing",
  "producing",
  "recording",
  "mixing",
  "mastering",
  "complete",
] as const;

const stageLabels: Record<string, string> = {
  idea: "Idea",
  writing: "Writing",
  producing: "Producing",
  recording: "Recording",
  mixing: "Mixing",
  mastering: "Mastering",
  complete: "Complete",
};

const stageChecklist: Record<string, string[]> = {
  idea: ["Concept defined", "Mood reference found", "Key/BPM decided"],
  writing: ["Lyrics draft complete", "Melody sketch done", "Structure set"],
  producing: [
    "Beat/instrumental started",
    "Arrangement complete",
    "Sound design done",
  ],
  recording: ["Vocals recorded", "Takes selected", "Comp done"],
  mixing: ["Rough mix done", "Levels balanced", "Effects applied"],
  mastering: [
    "Master bounce done",
    "Multiple format exports",
    "Loudness checked",
  ],
  complete: ["Metadata filled", "Stems exported", "Sync score run"],
};

// Structure presets keyed to common sync formats. Picking one fills the
// Song Structure text field with timings inline, and a helper card below
// shows target duration, closure style (stinger / button / fade) and what
// music supervisors look for in that format.
interface StructureFormat {
  value: string;
  label: string;
  group: string;
  sections: string[];
  timings: string[]; // parallel array; one per section
  targetDuration: string;
  closure: string; // short phrase e.g. "Stinger ending"
  closureDetail: string; // supervisor rationale for that closure
  supervisorNotes: string;
}

const STRUCTURE_FORMATS: StructureFormat[] = [
  // Film / Cinematic
  {
    value: "film_emotional",
    label: "Film — Emotional Scene",
    group: "Film & Cinematic",
    sections: ["Intro", "Verse 1", "Pre-Hook", "Chorus", "Verse 2", "Chorus", "Bridge", "Chorus", "Outro"],
    timings: ["0:00–0:15", "0:15–0:45", "0:45–1:00", "1:00–1:30", "1:30–2:00", "2:00–2:30", "2:30–2:50", "2:50–3:20", "3:20–3:40"],
    targetDuration: "3:00–3:45",
    closure: "Soft button end",
    closureDetail: "Let the last chord ring out — supervisors dislike hard fades in emotional scenes because they stop dialog cold. Button ends give editors a clean cut point.",
    supervisorNotes: "Clear emotional hook by 0:45. Leave dynamic room in verses for dialog. Deliver instrumental + vocal-up stems. Under 3:45 total.",
  },
  {
    value: "film_action",
    label: "Film — Action / Tension",
    group: "Film & Cinematic",
    sections: ["Atmospheric Intro", "Tension Build", "First Drop", "Build", "Climax", "Resolution", "Outro"],
    timings: ["0:00–0:20", "0:20–0:50", "0:50–1:05", "1:05–1:35", "1:35–2:00", "2:00–2:20", "2:20–2:30"],
    targetDuration: "2:00–2:45",
    closure: "Hard stinger ending",
    closureDetail: "Sharp hit + instant decay. Editors chase stingers for impact cuts — a fade-out is useless here.",
    supervisorNotes: "Usable sting points every ~30s. Drops must cut cleanly (no reverb smear). Deliver a 15s trailer version alongside the full cue.",
  },
  // Trailer — built around the industry-standard 3-act structure
  // (Act 1 Setup / Act 2 Escalation / Act 3 Climax + optional Tag).
  // Act breaks happen around 0:30 and 1:20 with hits on those seams.
  {
    value: "trailer_3act_theatrical",
    label: "Trailer — 3-Act Theatrical (Main)",
    group: "Trailer",
    sections: [
      "Act 1 — Setup / World",
      "Act 1 Hit (Bridge to Act 2)",
      "Act 2 — Escalation / Stakes",
      "Act 2 Braam Hit",
      "Act 3 — Climax Build",
      "Title Card Drop",
      "Final Outro Hit",
      "Tag (Post-Title)",
    ],
    timings: [
      "0:00–0:28",
      "0:28–0:30",
      "0:30–1:15",
      "1:15–1:20",
      "1:20–2:00",
      "2:00–2:05",
      "2:05–2:20",
      "2:20–2:30",
    ],
    targetDuration: "2:30 (industry standard)",
    closure: "Title button + optional post-title tag",
    closureDetail: "Final hit lands on the title frame. Many trailers add a 5–10 second comedic or threat tag after the title — deliver a 'no tag' version too.",
    supervisorNotes: "Trailer editors work in 3 acts. Act 1 is dialog-safe and atmospheric; Act 2 builds; Act 3 is full. Hits at 0:30 and 1:20 are critical seam points — deliver stems so editors can retime. -6 dB true peak for broadcast.",
  },
  {
    value: "trailer_3act_epic",
    label: "Trailer — 3-Act Epic / Hybrid Orchestral",
    group: "Trailer",
    sections: [
      "Hush Intro",
      "Act 1 — World Bed",
      "Act 1 Hit (Riser + Braam)",
      "Act 2 — Rising Stakes",
      "Act 2 Climax Hit",
      "Act 3 — Full Orchestral",
      "Title Card Hit",
      "Extended Reverb Tail",
    ],
    timings: [
      "0:00–0:10",
      "0:10–0:30",
      "0:30–0:35",
      "0:35–1:15",
      "1:15–1:25",
      "1:25–2:20",
      "2:20–2:30",
      "2:30–2:45",
    ],
    targetDuration: "2:30–3:00",
    closure: "Button with long reverb tail (for logo reveal)",
    closureDetail: "Hit on the title frame, tail decays 10–15 seconds into silence for the studio logo. Don't bake in reverb — editors layer their own.",
    supervisorNotes: "Full orchestral + percussion (taiko, sub hits, braams, choir, risers). Deliver each family as a separate stem. Include a 90s cut-down alongside the full 2:30.",
  },
  {
    value: "trailer_teaser",
    label: "Trailer — Teaser (Short Announcement)",
    group: "Trailer",
    sections: [
      "Brand / Studio Logo",
      "Character or World Reveal",
      "Single-Beat Tension",
      "Announcement Hit",
      "Title Drop",
    ],
    timings: ["0:00–0:10", "0:10–0:30", "0:30–0:55", "0:55–1:00", "1:00–1:10"],
    targetDuration: "0:45–1:30",
    closure: "Title button (often coincides with logo reveal)",
    closureDetail: "Teasers tease — land the button on the title/franchise reveal. Leave the audience wanting more.",
    supervisorNotes: "Often uses the franchise theme or an iconic musical motif. Minimal dialog/VO. Subtlety wins. Keep dynamic range wide — teasers get played in loud theatrical environments.",
  },
  {
    value: "trailer_tv_60",
    label: "Trailer — 60s TV Spot",
    group: "Trailer",
    sections: [
      "Cold Open",
      "Mini Act 1 Hit",
      "Act 2 Tension Build",
      "Act 2 Hit",
      "Act 3 Climax",
      "Title Hit",
      "Tag",
    ],
    timings: [
      "0:00–0:12",
      "0:12–0:15",
      "0:15–0:40",
      "0:40–0:45",
      "0:45–0:55",
      "0:55–0:58",
      "0:58–1:00",
    ],
    targetDuration: "1:00 (exact)",
    closure: "Hard button on 0:58 or 1:00",
    closureDetail: "Broadcast requires landing at 1:00:00 — 2 frames over misses the slot. Title hit at 0:55, optional tag lands at 0:58–1:00.",
    supervisorNotes: "Broadcast-loudness compliant (-24 LUFS US / -23 LUFS EU). Vocal clearance if lyrics. Deliver both 'with tag' and 'no tag' versions.",
  },
  {
    value: "trailer_tv_30",
    label: "Trailer — 30s TV Spot",
    group: "Trailer",
    sections: [
      "Cold Open Hit",
      "Compressed Act 1",
      "Act 2 Hit",
      "Act 3 Climax",
      "Title Button",
    ],
    timings: ["0:00–0:03", "0:03–0:15", "0:15–0:18", "0:18–0:27", "0:27–0:30"],
    targetDuration: "0:30 (exact)",
    closure: "Hard button on 0:30",
    closureDetail: "Broadcast precision required — final downbeat on 0:30:00. No tail.",
    supervisorNotes: "Most condensed trailer format — every beat counts. Usually derived from the main trailer cue with acts 1 and 2 compressed. Broadcast loudness compliant.",
  },
  {
    value: "trailer_15",
    label: "Trailer — 15s Bumper / Pre-Roll",
    group: "Trailer",
    sections: ["Hit In", "Compressed Build", "Title Button"],
    timings: ["0:00–0:02", "0:02–0:12", "0:12–0:15"],
    targetDuration: "0:15 (exact)",
    closure: "Hard button on 0:15",
    closureDetail: "Pre-roll ad slots — frame-perfect. Button on the title.",
    supervisorNotes: "Entire arc in 15 seconds. Works best when viewer already knows the franchise. Musical identity from the main trailer cue, stripped to its essentials.",
  },
  // TV
  {
    value: "tv_drama",
    label: "TV — Drama / Prestige",
    group: "TV",
    sections: ["Intro", "Verse 1", "Chorus", "Verse 2", "Chorus", "Bridge", "Outro"],
    timings: ["0:00–0:15", "0:15–0:40", "0:40–1:10", "1:10–1:40", "1:40–2:10", "2:10–2:30", "2:30–3:00"],
    targetDuration: "2:30–3:30",
    closure: "Fade or soft button",
    closureDetail: "Supervisors favor fades for scene-outs and act breaks. Provide both a fade and a button version if possible.",
    supervisorNotes: "Hook in before 1:00. Two clear emotional peaks. Vocal-up and TV mix (vocals –3dB) deliverables. Clean instrumental stem for under-dialog use.",
  },
  {
    value: "tv_needle_drop",
    label: "TV — Needle Drop / Montage",
    group: "TV",
    sections: ["Short Intro", "Verse 1", "Chorus", "Verse 2", "Chorus", "Outro"],
    timings: ["0:00–0:08", "0:08–0:32", "0:32–1:00", "1:00–1:28", "1:28–1:56", "1:56–2:20"],
    targetDuration: "2:00–2:45",
    closure: "Button end (short fade OK)",
    closureDetail: "Montage cuts usually want a clear landing point so picture editors can time the out. Keep the tail ≤ 1 second.",
    supervisorNotes: "Identifiable hook in under 10 seconds — no slow builds. Upbeat energy. Clean fade points at 1:00, 1:30, 1:56 so editors can shorten.",
  },
  // Commercial / Ad
  {
    value: "ad_30",
    label: "Commercial — 30s Spot",
    group: "Commercial",
    sections: ["Intro (4 bars)", "Hook", "Verse", "Hook Tag", "Outro"],
    timings: ["0:00–0:05", "0:05–0:15", "0:15–0:22", "0:22–0:28", "0:28–0:30"],
    targetDuration: "0:30",
    closure: "Hard button (stinger)",
    closureDetail: "Must land exactly at 0:30:00 — 2 frames over blows the slot. Button hit on downbeat, no tail.",
    supervisorNotes: "Branded musical identity locked in first 5 seconds. Vocal hook under 15 syllables. Provide no-vocal and VO-under alt mixes.",
  },
  {
    value: "ad_60",
    label: "Commercial — 60s Spot",
    group: "Commercial",
    sections: ["Intro", "Hook", "Verse", "Hook", "Bridge", "Hook", "Outro"],
    timings: ["0:00–0:05", "0:05–0:15", "0:15–0:30", "0:30–0:40", "0:40–0:50", "0:50–0:58", "0:58–1:00"],
    targetDuration: "1:00",
    closure: "Hard button",
    closureDetail: "Lands on 0:60:00. Tight stop, no reverb.",
    supervisorNotes: "Hook by 0:05 and repeated at 0:30 and 0:50. Dialog-safe lull at 0:40–0:50 for closing VO. Deliver cut-downs at 30s and 15s.",
  },
  // Single / Release
  {
    value: "single_radio",
    label: "Single — Radio Pop",
    group: "Single & Release",
    sections: ["Intro", "Verse 1", "Pre-Hook", "Chorus", "Verse 2", "Pre-Hook", "Chorus", "Bridge", "Chorus", "Outro"],
    timings: ["0:00–0:10", "0:10–0:30", "0:30–0:45", "0:45–1:10", "1:10–1:30", "1:30–1:45", "1:45–2:10", "2:10–2:30", "2:30–3:00", "3:00–3:15"],
    targetDuration: "3:00–3:30",
    closure: "Short fade or clean button",
    closureDetail: "Modern radio leans button-end for playlist stitching, but a 6-second fade is still acceptable.",
    supervisorNotes: "Hook by 0:45, ideally sooner. Under 3:30 total. Radio-edit and clean-lyric versions expected.",
  },
  {
    value: "single_streaming",
    label: "Single — Streaming (Tight)",
    group: "Single & Release",
    sections: ["Intro", "Verse 1", "Chorus", "Verse 2", "Chorus", "Bridge", "Chorus"],
    timings: ["0:00–0:05", "0:05–0:25", "0:25–0:55", "0:55–1:20", "1:20–1:50", "1:50–2:10", "2:10–2:40"],
    targetDuration: "2:30–2:45",
    closure: "Button end (no fade)",
    closureDetail: "Streaming playlists favor clean buttons — fades feel dated and kill transitions between tracks.",
    supervisorNotes: "Hook before 0:30. TikTok-eligible 15s clip between 0:25–0:55. Keep total under 2:45 for skip-rate performance.",
  },
  {
    value: "single_indie",
    label: "Single — Indie / Alt",
    group: "Single & Release",
    sections: ["Intro", "Verse 1", "Chorus", "Verse 2", "Chorus", "Outro"],
    timings: ["0:00–0:20", "0:20–0:50", "0:50–1:20", "1:20–1:50", "1:50–2:20", "2:20–2:40"],
    targetDuration: "3:00–4:00",
    closure: "Fade or button (vibe-driven)",
    closureDetail: "Indie audiences accept long fades if they serve the song. Sync supervisors still prefer a clean button option — deliver both.",
    supervisorNotes: "Longer intros OK if they establish a texture. Provide an instrumental stem — indie sync placements often use the mood, not the vocal.",
  },
  // Video Games
  {
    value: "game_menu_loop",
    label: "Game — Menu / Ambient Loop",
    group: "Video Games",
    sections: ["Intro (1st play only)", "Loop Section A", "Loop Section B", "Loop Return"],
    timings: ["0:00–0:20", "0:20–1:10", "1:10–2:00", "2:00 → loops to 0:20"],
    targetDuration: "2:00–3:00 (looping)",
    closure: "Seamless loop (no true ending)",
    closureDetail: "Must loop without a pop or DC offset at the seam. Deliver the intro and loop as separate stems so the engine can fire the intro once and then sustain the loop.",
    supervisorNotes: "Flat harmonic tension — nothing that fatigues after 10 replays. Deliver a 'no intro' loop-only version plus stems (pad, melody, rhythm).",
  },
  {
    value: "game_combat",
    label: "Game — Combat / Action Loop",
    group: "Video Games",
    sections: ["Combat Entry", "Combat Bed", "Intensity Swell", "Combat Bed", "Loop Return"],
    timings: ["0:00–0:10", "0:10–0:50", "0:50–1:10", "1:10–2:00", "2:00 → loops to 0:10"],
    targetDuration: "1:30–2:30 (looping)",
    closure: "Combat-end stinger (separate cue)",
    closureDetail: "The loop sustains under combat; a separate 2–4 second stinger plays when combat ends. Deliver both.",
    supervisorNotes: "Strict tempo grid (adaptive audio middleware needs this). Intensity layers as stems so the game can crossfade dynamically.",
  },
  {
    value: "game_boss",
    label: "Game — Boss Fight / Multi-Phase",
    group: "Video Games",
    sections: ["Phase 1 (mid intensity)", "Phase 2 Transition", "Phase 2 (high intensity)", "Phase 3 Transition", "Phase 3 (climax)", "Victory Stinger"],
    timings: ["0:00–1:00", "1:00–1:05", "1:05–2:00", "2:00–2:05", "2:05–3:00", "3:00–3:05"],
    targetDuration: "3:00–4:00 + stingers",
    closure: "Victory stinger + defeat stinger (both as separate cues)",
    closureDetail: "Ship 3 phase stems + victory stinger + defeat stinger. The game system decides which fires.",
    supervisorNotes: "Escalation must feel earned — each phase adds a layer (subs, choir, percussion). Phase transitions need 1-bar pickup hits. Tight tempo lock.",
  },
  {
    value: "game_cutscene",
    label: "Game — Cinematic Cutscene",
    group: "Video Games",
    sections: ["Atmospheric Open", "Story Beat 1", "Build", "Story Beat 2", "Climax", "Resolution"],
    timings: ["0:00–0:20", "0:20–0:50", "0:50–1:20", "1:20–1:50", "1:50–2:20", "2:20–2:45"],
    targetDuration: "2:00–3:00",
    closure: "Button on final frame",
    closureDetail: "Treat like a film cue — clean hit on the last frame of picture, short tail. Dialog-safe lulls for VO beats.",
    supervisorNotes: "Dry stems (no bus reverb baked in — game audio adds its own 3D reverb). Minimum 24-bit / 48kHz delivery.",
  },
  {
    value: "game_stinger",
    label: "Game — Stinger / One-shot",
    group: "Video Games",
    sections: ["Attack", "Musical Body", "Resolution"],
    timings: ["0:00–0:01", "0:01–0:04", "0:04–0:06"],
    targetDuration: "2–8 seconds",
    closure: "Hard stinger end",
    closureDetail: "Final hit lands on the last frame, decay ≤ 1 beat. UI event cues get swallowed if they overhang.",
    supervisorNotes: "Memorable in under 3 seconds. One-shot categories: level-up, quest-complete, death, discovery, achievement. Ship as a pack with matching harmonic language.",
  },

  // YouTube & Creators
  {
    value: "yt_creator_intro",
    label: "YouTube — Creator Intro",
    group: "YouTube & Creators",
    sections: ["Signature Hit", "Brand Riff", "Button"],
    timings: ["0:00–0:02", "0:02–0:08", "0:08–0:10"],
    targetDuration: "5–15 seconds",
    closure: "Hard button",
    closureDetail: "Channel brand earworm — nothing over 15 seconds or viewers skip. Hard stop so the creator can jump into content.",
    supervisorNotes: "Front-load the hook in the first 2 seconds (YouTube's first-frame retention window). Ship with and without the whoosh/SFX layer.",
  },
  {
    value: "yt_background_bed",
    label: "YouTube — Background Bed / Lo-fi",
    group: "YouTube & Creators",
    sections: ["Soft Intro", "Bed (Part A)", "Bed (Part B)", "Soft Outro / Loop Point"],
    timings: ["0:00–0:15", "0:15–1:30", "1:30–2:45", "2:45–3:00"],
    targetDuration: "3:00–5:00 (loopable)",
    closure: "Seamless loop or long fade",
    closureDetail: "Creators cut to any length — provide loop points at 1:00, 2:00, 3:00 so they can match their video.",
    supervisorNotes: "No vocals. Harmonic interest is subtle, never peaks. Predictable energy — creators need headroom for voiceover.",
  },
  {
    value: "yt_outro",
    label: "YouTube — Outro / End Card",
    group: "YouTube & Creators",
    sections: ["Reflective Lift", "Call-to-Action Bed", "Soft Button"],
    timings: ["0:00–0:08", "0:08–0:22", "0:22–0:25"],
    targetDuration: "15–25 seconds",
    closure: "Soft button (not fade)",
    closureDetail: "Sits under 'subscribe' overlays. Clean button so video can end cleanly even if edited short.",
    supervisorNotes: "Hopeful, forward-moving. Don't land on a minor resolution — viewers feel it as a downer before the next video.",
  },

  // Podcasts
  {
    value: "podcast_intro",
    label: "Podcast — Intro Theme",
    group: "Podcast & Audio",
    sections: ["Hook Statement", "Brand Riff", "Cut to Host"],
    timings: ["0:00–0:05", "0:05–0:15", "0:15–0:20"],
    targetDuration: "10–20 seconds",
    closure: "Musical phrase cut (host talks over tail)",
    closureDetail: "Don't button hard — hosts want a 2-second musical tail they can duck under their first words.",
    supervisorNotes: "Instantly identifiable melodic hook. Tempo 90–120 BPM. Provide instrumental + 'ducked' version for voiceover.",
  },
  {
    value: "podcast_outro",
    label: "Podcast — Outro Theme",
    group: "Podcast & Audio",
    sections: ["Return of Hook", "Credits Bed", "Soft Button / Fade"],
    timings: ["0:00–0:08", "0:08–0:25", "0:25–0:30"],
    targetDuration: "20–30 seconds",
    closure: "Fade (soft) or soft button",
    closureDetail: "Hosts read credits over the bed. Deliver both a 15s button version and a 30s fade version.",
    supervisorNotes: "Echoes the intro hook so the listener gets a sense of closure. Warm, conclusive.",
  },
  {
    value: "podcast_transition",
    label: "Podcast — Transition / Bumper",
    group: "Podcast & Audio",
    sections: ["Sweep In", "Musical Tag", "Cut"],
    timings: ["0:00–0:02", "0:02–0:06", "0:06–0:07"],
    targetDuration: "5–10 seconds",
    closure: "Hard cut / button",
    closureDetail: "Separates segments. Crisp stop — hosts come in immediately after.",
    supervisorNotes: "Musically related to the intro/outro theme (same key/palette) for cohesion. Ship a pack of 3–5 variants.",
  },

  // Live Streaming
  {
    value: "twitch_starting",
    label: "Twitch — Starting Soon / BRB",
    group: "Live Streaming",
    sections: ["Soft Entry", "Loop Bed A", "Loop Bed B", "Loop Return"],
    timings: ["0:00–0:10", "0:10–1:10", "1:10–2:00", "2:00 → loops to 0:10"],
    targetDuration: "2:00–3:00 (loops infinitely)",
    closure: "Seamless infinite loop",
    closureDetail: "Runs for 5–30 minutes before a stream — no seam is allowed. Test loop continuity with a 10-rep listen.",
    supervisorNotes: "DMCA-safe (original composition, fully cleared). Low-attention: chat is reading, not listening. 80–110 BPM, no builds.",
  },
  {
    value: "twitch_background",
    label: "Twitch — Stream Background Bed",
    group: "Live Streaming",
    sections: ["Bed A", "Subtle Shift", "Bed B", "Subtle Shift", "Loop Return"],
    timings: ["0:00–0:45", "0:45–0:50", "0:50–1:35", "1:35–1:40", "1:40 → loops"],
    targetDuration: "3:00–5:00+ (loops)",
    closure: "Seamless loop",
    closureDetail: "Plays for hours during gameplay. No recognizable melody peaks — they compete with the game audio.",
    supervisorNotes: "DMCA-safe. Chill, textural, no hooks. 90–100 BPM. Provide a no-drums variant for action-heavy games.",
  },

  // Social Media
  {
    value: "tiktok_15",
    label: "TikTok / Reels — 15s Hook Loop",
    group: "Social Media",
    sections: ["Hook", "Body", "Loop Return"],
    timings: ["0:00–0:05", "0:05–0:15", "0:15 → loops to 0:00"],
    targetDuration: "15 seconds (loopable)",
    closure: "Seamless loop back to 0:00",
    closureDetail: "Users watch 3–5 loops before deciding to save or skip. The seam between end and restart must be inaudible.",
    supervisorNotes: "Hook at 0:00 — no intro. Vocal chop or instantly singable phrase. Provide both a clean version and a TikTok-tagged/slowed+reverb variant.",
  },
  {
    value: "tiktok_30",
    label: "TikTok / Reels — 30s Snippet",
    group: "Social Media",
    sections: ["Hook", "Verse", "Hook", "Tag"],
    timings: ["0:00–0:10", "0:10–0:20", "0:20–0:28", "0:28–0:30"],
    targetDuration: "30 seconds",
    closure: "Hard cut",
    closureDetail: "Platforms auto-trim to 30s — land the final beat on :30 or it gets cut mid-phrase.",
    supervisorNotes: "Two hook delivery points. End on a lyric that's meme-able. Upload a horizontal + square + vertical visualizer alongside.",
  },

  // Corporate / Explainer
  {
    value: "corp_explainer",
    label: "Corporate — Explainer Video",
    group: "Corporate & Explainer",
    sections: ["Soft Intro", "VO Bed", "Gentle Lift", "VO Bed", "Button"],
    timings: ["0:00–0:05", "0:05–0:40", "0:40–0:50", "0:50–1:20", "1:20–1:25"],
    targetDuration: "0:30–3:00 (flexible)",
    closure: "Soft button",
    closureDetail: "Cleanly resolves the VO message. No dramatic tail.",
    supervisorNotes: "Friendly, forward-moving, non-distracting. No emotional peaks that pull attention from the VO. Deliver 30s / 60s / 90s cut-downs.",
  },
  {
    value: "corp_reveal",
    label: "Corporate — Product / Logo Reveal",
    group: "Corporate & Explainer",
    sections: ["Anticipation", "Build", "Reveal Hit", "Sweetener Tail"],
    timings: ["0:00–0:10", "0:10–0:20", "0:20–0:22", "0:22–0:25"],
    targetDuration: "20–30 seconds",
    closure: "Hard hit + short sweetener tail",
    closureDetail: "Hit lands on the logo frame; sweetener decays into silence. Pair with a sound-design whoosh.",
    supervisorNotes: "Build must earn the hit — no flat ramps. Brand-sonic signature in the reveal. Deliver stems so editors can re-time the build.",
  },

  // Fitness & Workout
  {
    value: "fitness_cardio",
    label: "Fitness — Cardio / HIIT",
    group: "Fitness & Workout",
    sections: ["Warm-up", "Work Interval 1", "Rest", "Work Interval 2", "Rest", "Push Interval", "Cool-down"],
    timings: ["0:00–0:30", "0:30–1:00", "1:00–1:15", "1:15–1:45", "1:45–2:00", "2:00–2:45", "2:45–3:15"],
    targetDuration: "3:00–5:00",
    closure: "Hard button on beat 1",
    closureDetail: "Instructors cue off downbeats — no fade, no ambiguity.",
    supervisorNotes: "140–180 BPM locked tempo. Energy peaks at interval starts (0:30, 1:15, 2:00). DJ-style mix-in/out for instructor playlists.",
  },
  {
    value: "fitness_cooldown",
    label: "Fitness — Cool-down / Stretch",
    group: "Fitness & Workout",
    sections: ["Settle", "Breath Bed A", "Breath Bed B", "Close"],
    timings: ["0:00–0:30", "0:30–1:30", "1:30–2:30", "2:30–3:00"],
    targetDuration: "3:00–5:00",
    closure: "Long fade",
    closureDetail: "Over 6–10 seconds, heart rate should drop with the fade.",
    supervisorNotes: "90–100 BPM. No percussion spikes. Harmonic descent — resolution, not tension.",
  },

  // Wellness / Meditation
  {
    value: "wellness_meditation",
    label: "Wellness — Meditation Bed",
    group: "Wellness & Meditation",
    sections: ["Entry", "Breath Cycle 1", "Breath Cycle 2", "Settle", "Long Fade"],
    timings: ["0:00–0:30", "0:30–3:00", "3:00–5:30", "5:30–9:00", "9:00–10:00"],
    targetDuration: "5:00–30:00",
    closure: "Very long fade (10–20 seconds)",
    closureDetail: "The listener should barely notice the end. No hard stops.",
    supervisorNotes: "No rhythmic pulse (or very slow — breath tempo, ~6 BPM/breaths). Minimal melodic content. Supports breath, doesn't lead attention.",
  },
  {
    value: "wellness_yoga",
    label: "Wellness — Yoga / Ambient",
    group: "Wellness & Meditation",
    sections: ["Grounding", "Flow 1", "Peak Pose", "Flow 2", "Savasana"],
    timings: ["0:00–1:00", "1:00–3:00", "3:00–4:00", "4:00–6:00", "6:00–8:00"],
    targetDuration: "8:00–15:00",
    closure: "Long fade into silence",
    closureDetail: "Savasana needs 2–3 minutes of fade into total silence.",
    supervisorNotes: "Gentle harmonic movement. Signature sound is OK but never demanding. No surprises — yoga practitioners want predictability.",
  },

  // Custom
  {
    value: "custom",
    label: "Custom — free arrangement",
    group: "Custom",
    sections: [],
    timings: [],
    targetDuration: "—",
    closure: "Artist choice",
    closureDetail: "Build whatever serves the song.",
    supervisorNotes: "For sync consideration, prioritize: clear hook under 1:00, dialog-safe dynamic range, clean stems, and deliverables at multiple durations.",
  },
];

const musicalKeys = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
  "Cm",
  "C#m",
  "Dm",
  "D#m",
  "Em",
  "Fm",
  "F#m",
  "Gm",
  "G#m",
  "Am",
  "A#m",
  "Bm",
];

export default function SongLabDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<SongLabProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [newRef, setNewRef] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkable, setLinkable] = useState<LinkableSong[] | null>(null);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState(false);
  const [activeFormat, setActiveFormat] = useState<StructureFormat | null>(null);

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/song-lab/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        // Ensure checklist is an array
        if (!Array.isArray(data.checklist)) data.checklist = [];
        setProject(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Silent refresh — used by GuidancePanel after an agent run completes.
  // Avoids flipping `loading` to true, which would unmount the guidance
  // panel and replace it with skeletons for a blink.
  const refreshProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/song-lab/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        if (!Array.isArray(data.checklist)) data.checklist = [];
        setProject(data);
      }
    } catch {
      // ignore
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const autoSave = useCallback(
    (updates: Partial<SongLabProject>) => {
      if (!project) return;
      const updated = { ...project, ...updates };
      setProject(updated);
      setSaving(true);

      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        try {
          await fetch(`/api/song-lab/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
        } catch {
          // ignore
        } finally {
          setSaving(false);
        }
      }, 1500);
    },
    [project, projectId]
  );

  const handleStageClick = (stage: string) => {
    autoSave({ status: stage });
  };

  // Maps a guidance object from Producer/Songwriter/Collab into project field
  // patches. Each agent routes into its own dedicated tab so Lyrics stays
  // clean for actual lyrics and Structure is never clobbered.
  const handleApplyGuidance = useCallback(
    async (kind: AgentKey, guidance: Record<string, unknown>) => {
      if (!project) return;
      const patch: Partial<SongLabProject> = {};
      const appendWriting: string[] = [];
      const appendProducer: string[] = [];
      const appendNotes: string[] = [];
      const stampDate = new Date().toLocaleDateString();

      if (kind === "songwriter") {
        const sketch = guidance.structure_sketch as
          | Record<string, string>
          | undefined;
        if (sketch && !project.structure) {
          const order = ["verse_1", "chorus", "verse_2", "bridge"];
          const s = order
            .map((k) => sketch[k])
            .filter(Boolean)
            .map((v, i) => `[${["V1", "Chorus", "V2", "Bridge"][i]}] ${v}`)
            .join(" | ");
          if (s) patch.structure = s;
        }

        const themes = Array.isArray(guidance.themes)
          ? (guidance.themes as Array<Record<string, string>>)
          : [];
        if (themes.length > 0) {
          appendWriting.push(
            `## Themes\n${themes
              .map((t) =>
                `- **${t.theme}**${t.lens ? ` — ${t.lens}` : ""}`
              )
              .join("\n")}`
          );
        }

        const hooks = Array.isArray(guidance.hook_ideas)
          ? (guidance.hook_ideas as Array<Record<string, string>>)
          : [];
        if (hooks.length > 0) {
          appendWriting.push(
            `## Hook ideas\n${hooks
              .map(
                (h) =>
                  `- "${h.hook}"${h.setup ? `\n  _${h.setup}_` : ""}`
              )
              .join("\n")}`
          );
        }

        const couplets = Array.isArray(guidance.couplet_starters)
          ? (guidance.couplet_starters as Array<Record<string, string>>)
          : [];
        if (couplets.length > 0) {
          appendWriting.push(
            `## Couplet starters\n${couplets
              .map((c) => `- ${c.couplet}`)
              .join("\n")}`
          );
        }
      }

      if (kind === "producer") {
        const arrangement = guidance.arrangement as
          | Record<string, unknown>
          | undefined;
        const structureSuggestion = arrangement?.structure_suggestion as
          | string
          | undefined;
        if (structureSuggestion && !project.structure) {
          patch.structure = structureSuggestion;
        }

        const instrumentation = Array.isArray(guidance.instrumentation)
          ? (guidance.instrumentation as Array<Record<string, string>>)
          : [];
        if (instrumentation.length > 0) {
          appendProducer.push(
            `## Instrumentation\n${instrumentation
              .map((i) => `- **${i.element}** — ${i.direction}`)
              .join("\n")}`
          );
        }

        const arrStructure = arrangement?.structure_suggestion as string | undefined;
        const arrNotes = arrangement?.notes as string | undefined;
        if (arrStructure || arrNotes) {
          appendProducer.push(
            `## Arrangement\n${arrStructure ? `Structure: ${arrStructure}\n` : ""}${arrNotes ?? ""}`.trim()
          );
        }

        const mix = guidance.mix_direction as Record<string, unknown> | undefined;
        if (mix && typeof mix.notes === "string" && mix.notes.length > 0) {
          appendProducer.push(`## Mix direction\n${mix.notes}`);
        }
      }

      if (kind === "collab") {
        const archetypes = Array.isArray(guidance.archetypes)
          ? (guidance.archetypes as Array<Record<string, unknown>>)
          : [];
        if (archetypes.length > 0) {
          appendNotes.push(
            `## Collab archetypes\n${archetypes
              .slice(0, 5)
              .map((a) => `- **${a.role}** — ${a.label}`)
              .join("\n")}`
          );
        }
      }

      const composeBlock = (
        prev: string | null | undefined,
        title: string,
        sections: string[]
      ) =>
        `${prev ?? ""}${prev ? "\n\n" : ""}---\n*${title} · ${stampDate}*\n\n${sections.join("\n\n")}`.trim();

      if (appendWriting.length > 0) {
        patch.writing_ideas = composeBlock(
          project.writing_ideas,
          "Songwriter Apply",
          appendWriting
        );
      }
      if (appendProducer.length > 0) {
        patch.producer_ideas = composeBlock(
          project.producer_ideas,
          "Producer Apply",
          appendProducer
        );
      }
      if (appendNotes.length > 0) {
        patch.notes = composeBlock(
          project.notes,
          "Collab Apply",
          appendNotes
        );
      }

      if (Object.keys(patch).length > 0) {
        autoSave(patch);
      }
    },
    [project, autoSave]
  );

  const handleChecklistToggle = (itemId: string) => {
    if (!project) return;
    const updated = project.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    autoSave({ checklist: updated });
  };

  const initChecklist = useCallback(() => {
    if (!project) return;
    const items = stageChecklist[project.status] || [];
    const existing = project.checklist || [];
    // Keep existing items that match, add new ones
    const newChecklist = items.map((label) => {
      const existingItem = existing.find((e) => e.label === label);
      return (
        existingItem || {
          id: crypto.randomUUID(),
          label,
          done: false,
        }
      );
    });
    if (
      JSON.stringify(newChecklist.map((c) => c.label)) !==
      JSON.stringify(existing.map((c) => c.label))
    ) {
      autoSave({ checklist: newChecklist });
    }
  }, [project, autoSave]);

  useEffect(() => {
    if (project && project.status) {
      initChecklist();
    }
    // Only run when status changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.status]);

  const handleAddRef = () => {
    if (!newRef.trim() || !project) return;
    const updated = [...(project.reference_tracks || []), newRef.trim()];
    autoSave({ reference_tracks: updated });
    setNewRef("");
  };

  const handleRemoveRef = (index: number) => {
    if (!project) return;
    const updated = project.reference_tracks.filter((_, i) => i !== index);
    autoSave({ reference_tracks: updated });
  };

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const res = await fetch(`/api/song-lab/${projectId}/promote`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setProject((prev) => (prev ? { ...prev, song_id: data.song.id } : prev));
      }
    } catch {
      // ignore
    } finally {
      setPromoting(false);
    }
  };

  const openLinkDialog = useCallback(async () => {
    setLinkOpen(true);
    setLinkError(null);
    if (linkable !== null) return;
    try {
      const res = await fetch(`/api/song-lab/${projectId}/link`);
      if (res.ok) {
        const data = await res.json();
        setLinkable(data.songs ?? []);
      } else {
        setLinkError("Could not load vault songs");
      }
    } catch {
      setLinkError("Could not load vault songs");
    }
  }, [projectId, linkable]);

  const handleLink = async (songId: string) => {
    setLinking(true);
    setLinkError(null);
    try {
      const res = await fetch(`/api/song-lab/${projectId}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: songId }),
      });
      const data = await res.json();
      if (res.ok) {
        setProject((prev) => (prev ? { ...prev, song_id: songId } : prev));
        setLinkOpen(false);
        setLinkable(null);
      } else {
        setLinkError(data.error || "Link failed");
      }
    } catch {
      setLinkError("Link failed");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Unlink this project from the vault song? The vault song will not be deleted."))
      return;
    setUnlinking(true);
    try {
      const res = await fetch(`/api/song-lab/${projectId}/link`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProject((prev) => (prev ? { ...prev, song_id: null } : prev));
        setLinkable(null);
      }
    } catch {
      // ignore
    } finally {
      setUnlinking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-white mb-4">Project not found</p>
        <Button size="sm" onClick={() => router.push("/song-lab")}>
          Back to Song Lab
        </Button>
      </div>
    );
  }

  const currentStageIndex = stages.indexOf(
    project.status as (typeof stages)[number]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/song-lab")}
            className="text-[#A3A3A3] hover:text-white transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-[10px] text-[#A3A3A3] flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </span>
            )}
          </div>
        </div>
        {project.song_id ? (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            >
              <Music className="size-3 mr-1" />
              In Vault
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUnlink}
              disabled={unlinking}
              title="Unlink from vault song (song stays in vault)"
            >
              {unlinking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Link2Off className="size-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={openLinkDialog}
              data-testid="link-vault-song"
            >
              <Link2 className="size-4 mr-2" />
              Link vault song
            </Button>
            {project.status === "complete" && (
              <Button size="sm" onClick={handlePromote} disabled={promoting}>
                {promoting ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Upload className="size-4 mr-2" />
                )}
                Promote to Vault
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Main Workspace */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <input
            type="text"
            value={project.title}
            onChange={(e) => autoSave({ title: e.target.value })}
            className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-zinc-600 focus:outline-none border-b border-transparent focus:border-[#DC2626]/30 pb-1"
            placeholder="Project title..."
          />

          {/* Stage Selector */}
          <div className="flex items-center gap-1">
            {stages.map((stage, i) => (
              <button
                key={stage}
                onClick={() => handleStageClick(stage)}
                className="flex-1 group relative"
              >
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i <= currentStageIndex
                      ? "bg-[#DC2626]"
                      : "bg-[#1A1A1A] group-hover:bg-[#333]"
                  )}
                />
                <span
                  className={cn(
                    "block text-[9px] mt-1 text-center transition-colors capitalize",
                    i === currentStageIndex
                      ? "text-[#DC2626] font-semibold"
                      : i < currentStageIndex
                        ? "text-[#A3A3A3]"
                        : "text-[#555]"
                  )}
                >
                  {stageLabels[stage]}
                </span>
              </button>
            ))}
          </div>

          {/* Musical Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-[#666] uppercase tracking-wider mb-1 block">
                BPM
              </label>
              <input
                type="number"
                value={project.bpm || ""}
                onChange={(e) =>
                  autoSave({
                    bpm: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="120"
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#666] uppercase tracking-wider mb-1 block">
                Key
              </label>
              <select
                value={project.key || ""}
                onChange={(e) =>
                  autoSave({ key: e.target.value || null })
                }
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]/50"
              >
                <option value="">Select key</option>
                {musicalKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#666] uppercase tracking-wider mb-1 block">
                Genre
              </label>
              <input
                type="text"
                value={project.genre || ""}
                onChange={(e) =>
                  autoSave({ genre: e.target.value || null })
                }
                placeholder="e.g. R&B, Pop"
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#666] uppercase tracking-wider mb-1 block">
                Mood
              </label>
              <input
                type="text"
                value={project.mood || ""}
                onChange={(e) =>
                  autoSave({ mood: e.target.value || null })
                }
                placeholder="e.g. Chill, Dark"
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
              />
            </div>
          </div>

          {/* Structure — format picker seeds the structure text with timings;
               helper panel shows closure + music-supervisor notes. */}
          <div className="space-y-2">
            <label className="text-[10px] text-[#666] uppercase tracking-wider block">
              Song Structure
            </label>
            <select
              value=""
              onChange={(e) => {
                const preset = STRUCTURE_FORMATS.find(
                  (f) => f.value === e.target.value
                );
                if (!preset) return;
                if (preset.value === "custom") {
                  autoSave({ structure: null });
                } else {
                  const next = preset.sections
                    .map((s, i) =>
                      preset.timings[i] ? `${s} (${preset.timings[i]})` : s
                    )
                    .join(" · ");
                  autoSave({ structure: next });
                }
                setActiveFormat(preset);
                e.target.value = "";
              }}
              className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]/50"
            >
              <option value="" disabled>
                Pick a sync-format template…
              </option>
              {Array.from(
                new Set(STRUCTURE_FORMATS.map((f) => f.group))
              ).map((group) => (
                <optgroup key={group} label={group}>
                  {STRUCTURE_FORMATS.filter((f) => f.group === group).map(
                    (f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    )
                  )}
                </optgroup>
              ))}
            </select>
            <input
              type="text"
              value={project.structure || ""}
              onChange={(e) =>
                autoSave({ structure: e.target.value || null })
              }
              placeholder="Custom arrangement — type sections separated by · "
              className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
            />

            {activeFormat && activeFormat.value !== "custom" && (
              <div className="mt-2 rounded-lg border border-[#1A1A1A] bg-[#0B0B0B] p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#666]">
                      Template
                    </p>
                    <p className="text-sm font-medium text-white">
                      {activeFormat.label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-[#666]">
                      Target length
                    </p>
                    <p className="text-sm text-white tabular-nums">
                      {activeFormat.targetDuration}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                    Section Timings
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                    {activeFormat.sections.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-baseline justify-between text-[11px] border-b border-[#151515] py-0.5"
                      >
                        <span className="text-[#D4D4D4]">{s}</span>
                        <span className="text-[#8892a4] tabular-nums">
                          {activeFormat.timings[i] ?? "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#666]">
                    Closure
                  </p>
                  <p className="text-xs text-white font-medium">
                    {activeFormat.closure}
                  </p>
                  <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
                    {activeFormat.closureDetail}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#666]">
                    What supervisors look for
                  </p>
                  <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
                    {activeFormat.supervisorNotes}
                  </p>
                </div>
              </div>
            )}

            <p className="text-[10px] text-[#666]">
              Pick a template to seed the structure, then edit freely. Timings
              are targets — the supervisor panel reflects industry norms.
            </p>
          </div>

          {/* Intent — scope + placement target */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#666] uppercase tracking-wider mb-1 block">
                Project Scope
              </label>
              <select
                value={project.project_mode || "single"}
                onChange={(e) =>
                  autoSave({ project_mode: e.target.value as "single" | "album" })
                }
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]/50"
              >
                <option value="single">Single</option>
                <option value="album">Album track</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#666] uppercase tracking-wider mb-1 block">
                Placement Intent
              </label>
              <select
                value={project.placement_intent || "both"}
                onChange={(e) =>
                  autoSave({
                    placement_intent: e.target.value as
                      | "sync"
                      | "brand_release"
                      | "both",
                  })
                }
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]/50"
              >
                <option value="both">Both — sync + brand release</option>
                <option value="sync">Sync placement (film / TV / ads)</option>
                <option value="brand_release">Brand release (artist drop)</option>
              </select>
            </div>
          </div>

          {/* Workspace Tabs */}
          <Tabs defaultValue="lyrics">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
              <TabsTrigger value="writing">Writing Ideas</TabsTrigger>
              <TabsTrigger value="producer">Producer Ideas</TabsTrigger>
              <TabsTrigger value="metaphors">Metaphor Hub</TabsTrigger>
              <TabsTrigger value="brand">Brand Connection</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="lyrics">
              <textarea
                value={project.lyrics || ""}
                onChange={(e) => autoSave({ lyrics: e.target.value || null })}
                placeholder="Write your lyrics here — verses, choruses, bridges. Only actual lyrics belong in this tab."
                rows={14}
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none font-mono leading-relaxed"
              />
            </TabsContent>

            <TabsContent value="writing">
              <p className="text-[11px] text-[#A3A3A3] mb-2">
                Themes, hooks, couplet starters. Songwriter Apply lands here.
              </p>
              <textarea
                value={project.writing_ideas || ""}
                onChange={(e) =>
                  autoSave({ writing_ideas: e.target.value || null })
                }
                placeholder="Hooks, themes, setups, couplet starters, emotional arcs..."
                rows={14}
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none font-mono leading-relaxed"
              />
            </TabsContent>

            <TabsContent value="producer">
              <p className="text-[11px] text-[#A3A3A3] mb-2">
                Instrumentation, arrangement, mix direction. Producer Apply lands here.
              </p>
              <textarea
                value={project.producer_ideas || ""}
                onChange={(e) =>
                  autoSave({ producer_ideas: e.target.value || null })
                }
                placeholder="Instrument by instrument, arrangement choices, mix direction..."
                rows={14}
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none font-mono leading-relaxed"
              />
            </TabsContent>

            <TabsContent value="metaphors">
              <p className="text-[11px] text-[#A3A3A3] mb-2">
                Concept layer — metaphors and symbols that give the song depth. Feeds lyrics + production choices.
              </p>
              <textarea
                value={project.metaphors || ""}
                onChange={(e) =>
                  autoSave({ metaphors: e.target.value || null })
                }
                placeholder={`e.g.
- "A sad night" as the moment before dawn — hope dressed as grief
- Rain as the body's way of crying so the sky doesn't have to`}
                rows={14}
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none leading-relaxed"
              />
            </TabsContent>

            <TabsContent value="brand">
              <p className="text-[11px] text-[#A3A3A3] mb-2">
                How this project ties back to your Brand Wiki — audience fit, sonic identity, sync targets.
              </p>
              <textarea
                value={project.brand_connection || ""}
                onChange={(e) =>
                  autoSave({ brand_connection: e.target.value || null })
                }
                placeholder="How does this song extend the brand? Who is it for within your audience? Which sync targets does it serve?"
                rows={10}
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none leading-relaxed"
              />
            </TabsContent>

            <TabsContent value="notes">
              <p className="text-[11px] text-[#A3A3A3] mb-2">
                Catch-all — reminders, session logs, collab archetypes.
              </p>
              <textarea
                value={project.notes || ""}
                onChange={(e) => autoSave({ notes: e.target.value || null })}
                placeholder="Production notes, ideas, reminders..."
                rows={10}
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none leading-relaxed"
              />
            </TabsContent>
          </Tabs>

          {/* Opportunity Scanner — visible from writing stage onward */}
          {project.status !== "idea" && (
            <OpportunityScanner projectId={project.id} />
          )}

          {/* Reference Tracks */}
          <div>
            <label className="text-[10px] text-[#666] uppercase tracking-wider mb-2 block">
              Reference Tracks
            </label>
            <div className="space-y-1.5 mb-2">
              {(project.reference_tracks || []).map((ref, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-[#111] border border-[#1A1A1A] rounded px-3 py-2"
                >
                  <Music className="size-3 text-[#A3A3A3] shrink-0" />
                  <span className="text-sm text-white flex-1">{ref}</span>
                  <button
                    onClick={() => handleRemoveRef(i)}
                    className="text-zinc-600 hover:text-red-400"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newRef}
                onChange={(e) => setNewRef(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddRef();
                }}
                placeholder="Add reference track..."
                className="flex-1 bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddRef}
                disabled={!newRef.trim()}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column — Tools */}
        <div className="space-y-5">
          {/* AI Guidance (Producer / Songwriter / Collab) */}
          <GuidancePanel
            projectId={project.id}
            initial={{
              producer_guidance: project.producer_guidance,
              producer_guidance_at: project.producer_guidance_at,
              songwriter_guidance: project.songwriter_guidance,
              songwriter_guidance_at: project.songwriter_guidance_at,
              collab_suggestions: project.collab_suggestions,
              collab_suggestions_at: project.collab_suggestions_at,
            }}
            onApplyToProject={handleApplyGuidance}
            onAgentComplete={refreshProject}
          />

          {/* Brand Fit — read-only from the linked vault song */}
          <LinkedSongBrandFit songId={project.song_id} />

          {/* Production Checklist */}
          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Check className="size-4 text-[#DC2626]" />
                {stageLabels[project.status] || "Production"} Checklist
              </h3>
              <div className="space-y-2">
                {(project.checklist || []).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleChecklistToggle(item.id)}
                    className="flex items-center gap-2.5 w-full text-left group"
                  >
                    <div
                      className={cn(
                        "size-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                        item.done
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-[#333] group-hover:border-[#DC2626]"
                      )}
                    >
                      {item.done && (
                        <svg
                          className="size-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        item.done
                          ? "text-zinc-500 line-through"
                          : "text-white"
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Status */}
          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {project.status !== "complete" && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const nextIndex = currentStageIndex + 1;
                      if (nextIndex < stages.length) {
                        handleStageClick(stages[nextIndex]);
                      }
                    }}
                  >
                    Advance to{" "}
                    {stageLabels[stages[currentStageIndex + 1]] || "Next"}
                  </Button>
                )}
                {project.status === "complete" && !project.song_id && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handlePromote}
                    disabled={promoting}
                  >
                    {promoting ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="size-4 mr-2" />
                    )}
                    Promote to Vault
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-red-400 hover:text-red-300"
                  onClick={async () => {
                    if (
                      confirm(
                        "Are you sure you want to delete this project?"
                      )
                    ) {
                      await fetch(`/api/song-lab/${projectId}`, {
                        method: "DELETE",
                      });
                      router.push("/song-lab");
                    }
                  }}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Link vault song</DialogTitle>
            <DialogDescription>
              Associate this project with an existing vault song. Brand Fit and other
              vault-based tools will reflect that song. The project stays in Song Lab.
            </DialogDescription>
          </DialogHeader>
          {linkError && (
            <p className="text-xs text-red-400">{linkError}</p>
          )}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#1A1A1A] border border-[#1A1A1A] rounded">
            {linkable === null ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : linkable.length === 0 ? (
              <div className="p-4 text-sm text-[#A3A3A3]">
                No available vault songs. Either your vault is empty or every song is already
                linked to another project.
              </div>
            ) : (
              linkable.map((s) => {
                const meta = Array.isArray(s.song_metadata)
                  ? s.song_metadata[0]
                  : s.song_metadata;
                const parts = [
                  meta?.genre,
                  meta?.bpm ? `${meta.bpm} BPM` : null,
                  meta?.key,
                ].filter(Boolean);
                return (
                  <button
                    key={s.id}
                    onClick={() => handleLink(s.id)}
                    disabled={linking}
                    className="w-full text-left px-3 py-2 hover:bg-[#111] disabled:opacity-50 flex items-start gap-3"
                  >
                    <Music className="size-4 text-[#A3A3A3] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{s.title}</div>
                      <div className="text-[11px] text-[#A3A3A3] truncate">
                        {parts.length > 0 ? parts.join(" · ") : "No metadata"}
                      </div>
                    </div>
                    {s.status && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {s.status}
                      </Badge>
                    )}
                  </button>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLinkOpen(false)}
              disabled={linking}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
