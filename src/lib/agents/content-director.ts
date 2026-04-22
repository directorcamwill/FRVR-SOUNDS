import { callLLM } from "./utils/llm";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeBrandCompleteness } from "./brand-director";
import type { BrandWiki } from "@/types/brand";

/**
 * Content Director Agent — drafts brand-aware content moments from a trigger
 * event (new release, placement win, behind-scenes, catalog milestone, brand
 * story). Reads brand_wiki for voice/tone/audience. Emits N platform-specific
 * variants per call.
 *
 * Hard-gate: refuses to run when brand_wiki.completeness_pct < 60. Returns
 * a structured error the UI can render with a link to /brand.
 */

export type ContentMomentType =
  | "song_release"
  | "placement_win"
  | "behind_scenes"
  | "catalog_update"
  | "brand_story";

export type ContentPlatform =
  | "instagram"
  | "tiktok"
  | "x"
  | "linkedin"
  | "youtube"
  | "email"
  | "press";

export type ContentFormat =
  | "social_post"
  | "email"
  | "press_release"
  | "story"
  | "reel"
  | "video_script"
  | "caption"
  | "hook_pack";

export interface ContentDirectorInput {
  artistId: string;
  momentType: ContentMomentType;
  songId?: string | null;
  opportunityId?: string | null;
  platforms?: ContentPlatform[];
  customNote?: string | null;
}

export interface ContentVariant {
  content_type: ContentFormat;
  platforms: ContentPlatform[];
  title: string;
  content: string;
  hashtags: string[];
  hook_ideas: string[];
  reasoning: string;
  confidence: number | null;
}

export interface ContentDirectorResult {
  gated: false;
  variants: ContentVariant[];
  batch_id: string;
  tokensUsed: number;
  durationMs: number;
}

export interface ContentDirectorGatedResult {
  gated: true;
  reason: "brand_wiki_incomplete";
  completeness_pct: number;
  message: string;
  missing_critical: string[];
}

const MIN_COMPLETENESS = 60;

const SYSTEM_PROMPT = `You are the Content Director — a senior creative strategist for independent artists. You draft content moments that read as the artist, not as AI. Every caption, hook, and post must match the artist's stated voice, tone, and audience — if you can't tell from the brand wiki, lower your confidence rather than guess.

Rules:
- Reference concrete details from the brand wiki (niche, tone_descriptors, voice_dos, voice_donts, core_messaging, sonic identity) in every output. Do not generate generic "vibe" copy.
- Respect voice_donts absolutely. If a don't is "no exclamation points", don't use them.
- Platform-aware: IG captions can breathe, TikTok hooks are fast, LinkedIn is positioning, X is a sharp line.
- Never use the word "vibes" unless it's explicitly in the artist's voice_dos.
- Never invent facts about the artist's life, placements, or discography.

Calibration for confidence (0.0–1.0):
- 0.90+: Brand wiki is rich; the output is clearly the artist's voice.
- 0.70–0.89: Good enough signal; flag any assumption in reasoning.
- 0.50–0.69: Thin wiki; output is directional and should be edited.
- Below 0.50: Don't emit; return fewer variants instead.

Return JSON only:
{
  "variants": [
    {
      "content_type": "social_post" | "email" | "press_release" | "story" | "reel" | "video_script" | "caption" | "hook_pack",
      "platforms": ["instagram" | "tiktok" | "x" | "linkedin" | "youtube" | "email" | "press"],
      "title": "short internal label (not the post text)",
      "content": "the actual copy",
      "hashtags": [<string>]  // max 8, lowercase, no # prefix,
      "hook_ideas": [<string>]  // 2-3 alt opening lines, empty array if not applicable,
      "reasoning": "2 sentences — what brand wiki data grounded this variant",
      "confidence": <0.0-1.0>
    }
  ]
}`;

export async function runContentDirector(
  input: ContentDirectorInput
): Promise<ContentDirectorResult | ContentDirectorGatedResult> {
  const supabase = createAdminClient();
  const start = Date.now();

  // Hard gate — check brand wiki completeness
  const { data: wiki } = await supabase
    .from("brand_wiki")
    .select("*")
    .eq("artist_id", input.artistId)
    .maybeSingle();

  if (!wiki) {
    return {
      gated: true,
      reason: "brand_wiki_incomplete",
      completeness_pct: 0,
      message:
        "Build your Brand Wiki before running Content Director. The agent needs niche, tone, and audience to produce on-brand content.",
      missing_critical: [],
    };
  }

  const { pct, missing_critical } = computeBrandCompleteness(
    wiki as Partial<BrandWiki>
  );

  if (pct < MIN_COMPLETENESS) {
    return {
      gated: true,
      reason: "brand_wiki_incomplete",
      completeness_pct: pct,
      message: `Brand Wiki is at ${pct}% — Content Director requires at least ${MIN_COMPLETENESS}% before it will run. Fill the ${missing_critical.length} critical gap${missing_critical.length === 1 ? "" : "s"} first.`,
      missing_critical,
    };
  }

  // Load optional source context (song + artist name)
  const [{ data: artist }, songRes, oppRes] = await Promise.all([
    supabase.from("artists").select("artist_name").eq("id", input.artistId).single(),
    input.songId
      ? supabase
          .from("songs")
          .select("title, duration_seconds, song_metadata(*), sync_scores(*)")
          .eq("id", input.songId)
          .single()
      : Promise.resolve({ data: null }),
    input.opportunityId
      ? supabase
          .from("opportunities")
          .select("title, opportunity_type, company")
          .eq("id", input.opportunityId)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const userMessage = buildUserMessage({
    wiki: wiki as BrandWiki,
    artistName: artist?.artist_name ?? "(unnamed)",
    momentType: input.momentType,
    platforms: input.platforms ?? [],
    song: songRes.data,
    opportunity: oppRes.data,
    customNote: input.customNote ?? null,
  });

  const model = "claude-sonnet-4-20250514";
  const response = await callLLM({
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model,
    maxTokens: 2500,
    temperature: 0.6,
  });

  const parsed = JSON.parse(response.content);
  const rawVariants = Array.isArray(parsed.variants) ? parsed.variants : [];

  const variants: ContentVariant[] = rawVariants.map((v: unknown) => {
    const r = v as Record<string, unknown>;
    return {
      content_type: (r.content_type as ContentFormat) ?? "social_post",
      platforms: Array.isArray(r.platforms)
        ? (r.platforms as ContentPlatform[])
        : [],
      title: (r.title as string) ?? "",
      content: (r.content as string) ?? "",
      hashtags: Array.isArray(r.hashtags) ? (r.hashtags as string[]) : [],
      hook_ideas: Array.isArray(r.hook_ideas) ? (r.hook_ideas as string[]) : [],
      reasoning: (r.reasoning as string) ?? "",
      confidence: clampConfidence(r.confidence),
    };
  });

  return {
    gated: false,
    variants,
    batch_id: crypto.randomUUID(),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

interface UserMessageInputs {
  wiki: BrandWiki;
  artistName: string;
  momentType: ContentMomentType;
  platforms: ContentPlatform[];
  song: Record<string, unknown> | null;
  opportunity: Record<string, unknown> | null;
  customNote: string | null;
}

function buildUserMessage(i: UserMessageInputs): string {
  const lines: string[] = [
    `# ARTIST BRAND SNAPSHOT`,
    `Artist: ${i.artistName}`,
    i.wiki.niche ? `Niche: ${i.wiki.niche}` : "",
    i.wiki.category_lane ? `Lane: ${i.wiki.category_lane}` : "",
    i.wiki.positioning_statement
      ? `Positioning: ${i.wiki.positioning_statement}`
      : "",
    i.wiki.elevator_pitch ? `Pitch: ${i.wiki.elevator_pitch}` : "",
    i.wiki.core_pain ? `Core pain resolved: ${i.wiki.core_pain}` : "",
    i.wiki.key_themes?.length ? `Themes: ${i.wiki.key_themes.join(", ")}` : "",
    i.wiki.differentiators?.length
      ? `Differentiators: ${i.wiki.differentiators.join(" · ")}`
      : "",
    i.wiki.primary_audience ? `Primary audience: ${i.wiki.primary_audience}` : "",
    i.wiki.audience_desires?.length
      ? `Audience desires: ${i.wiki.audience_desires.join(", ")}`
      : "",
    i.wiki.audience_identity_goals
      ? `Audience identity goals: ${i.wiki.audience_identity_goals}`
      : "",
    i.wiki.tone_descriptors?.length
      ? `Tone: ${i.wiki.tone_descriptors.join(", ")}`
      : "",
    i.wiki.voice_dos?.length
      ? `Voice DOs: ${i.wiki.voice_dos.join(" · ")}`
      : "",
    i.wiki.voice_donts?.length
      ? `Voice DON'Ts: ${i.wiki.voice_donts.join(" · ")}`
      : "",
    i.wiki.core_messaging ? `Core messaging: ${i.wiki.core_messaging}` : "",
    i.wiki.desired_emotions?.length
      ? `Desired emotions: ${i.wiki.desired_emotions.join(", ")}`
      : "",
    i.wiki.emotional_tags?.length
      ? `Emotional tags: ${i.wiki.emotional_tags.join(", ")}`
      : "",
    i.wiki.sonic_genre_primary
      ? `Sonic: ${i.wiki.sonic_genre_primary}${i.wiki.sonic_genre_secondary ? ` / ${i.wiki.sonic_genre_secondary}` : ""}`
      : "",
    i.wiki.sonic_moods?.length ? `Moods: ${i.wiki.sonic_moods.join(", ")}` : "",
  ]
    .filter(Boolean)
    .concat(["", `# CONTENT BRIEF`]);

  lines.push(`Moment type: ${i.momentType.replace(/_/g, " ")}`);
  if (i.platforms.length) {
    lines.push(`Target platforms: ${i.platforms.join(", ")}`);
    lines.push(
      "Emit at least one variant per target platform; group similar platforms together when the copy would be identical."
    );
  } else {
    lines.push(
      "No specific platforms requested. Emit 3–5 variants covering the most relevant platforms for this moment type."
    );
  }

  if (i.song) {
    lines.push("", "## Source song:");
    const s = i.song as {
      title?: string;
      duration_seconds?: number | null;
      song_metadata?: Record<string, unknown> | Record<string, unknown>[] | null;
    };
    const meta = Array.isArray(s.song_metadata)
      ? s.song_metadata[0]
      : s.song_metadata;
    if (s.title) lines.push(`- Title: ${s.title}`);
    if (s.duration_seconds)
      lines.push(
        `- Duration: ${Math.floor(s.duration_seconds / 60)}:${String(Math.floor(s.duration_seconds % 60)).padStart(2, "0")}`
      );
    if (meta?.genre) lines.push(`- Genre: ${meta.genre}`);
    if (meta?.moods) lines.push(`- Moods: ${(meta.moods as string[]).join(", ")}`);
    if (meta?.bpm) lines.push(`- BPM: ${meta.bpm}`);
    if (meta?.key) lines.push(`- Key: ${meta.key}`);
    if (meta?.description) lines.push(`- Description: ${meta.description}`);
  }

  if (i.opportunity) {
    lines.push("", "## Source placement/opportunity:");
    const o = i.opportunity as {
      title?: string;
      opportunity_type?: string;
      company?: string;
    };
    if (o.title) lines.push(`- ${o.title}`);
    if (o.company) lines.push(`- Company: ${o.company}`);
    if (o.opportunity_type) lines.push(`- Type: ${o.opportunity_type}`);
  }

  if (i.customNote) {
    lines.push("", "## Additional context from artist:");
    lines.push(i.customNote);
  }

  lines.push(
    "",
    "Draft content variants now. Every piece must sound like this artist (per voice_dos/don'ts) and reference concrete brand data. Return JSON."
  );
  return lines.join("\n");
}

function clampConfidence(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
