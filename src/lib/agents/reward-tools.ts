import { callLLM } from "./utils/llm";
import type { BrandWiki } from "@/types/brand";

/**
 * Brand Wiki Rewards — three generators that turn a completed wiki into
 * concrete artist assets. All Studio-tier (gated via `brand_wiki_activated`).
 *
 *   - Social Profile Builder: handle ideas, bio, link-in-bio, pinned post.
 *   - Photo Art Direction: press-photo shot list + mood references.
 *   - Products + Offers: tiered service/merch/ticketing ideas for this audience.
 */

export type RewardTool = "social" | "photos" | "offers";

// ─── Shared ───────────────────────────────────────────────────────────────

interface AgentResponse<T> {
  output: T;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

function clampConfidence(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, n));
}

function brandSnapshot(wiki: BrandWiki, artistName: string): string {
  const lines: string[] = [
    `Artist: ${artistName}`,
    wiki.niche && `Niche: ${wiki.niche}`,
    wiki.category_lane && `Lane: ${wiki.category_lane}`,
    wiki.positioning_statement && `Positioning: ${wiki.positioning_statement}`,
    wiki.elevator_pitch && `Pitch: ${wiki.elevator_pitch}`,
    wiki.core_pain && `Core pain resolved: ${wiki.core_pain}`,
    wiki.key_themes?.length && `Themes: ${wiki.key_themes.join(", ")}`,
    wiki.differentiators?.length &&
      `Differentiators: ${wiki.differentiators.join(" · ")}`,
    wiki.primary_audience && `Primary audience: ${wiki.primary_audience}`,
    wiki.secondary_audience && `Secondary audience: ${wiki.secondary_audience}`,
    wiki.audience_desires?.length &&
      `Audience desires: ${wiki.audience_desires.join(", ")}`,
    wiki.audience_identity_goals &&
      `Audience identity goals: ${wiki.audience_identity_goals}`,
    wiki.tone_descriptors?.length &&
      `Tone: ${wiki.tone_descriptors.join(", ")}`,
    wiki.voice_dos?.length && `Voice DOs: ${wiki.voice_dos.join(" · ")}`,
    wiki.voice_donts?.length && `Voice DON'Ts: ${wiki.voice_donts.join(" · ")}`,
    wiki.core_messaging && `Core messaging: ${wiki.core_messaging}`,
    wiki.desired_emotions?.length &&
      `Desired emotions: ${wiki.desired_emotions.join(", ")}`,
    wiki.emotional_tags?.length &&
      `Emotional tags: ${wiki.emotional_tags.join(", ")}`,
    wiki.sonic_genre_primary &&
      `Sonic: ${wiki.sonic_genre_primary}${wiki.sonic_genre_secondary ? ` / ${wiki.sonic_genre_secondary}` : ""}`,
    wiki.sonic_moods?.length && `Moods: ${wiki.sonic_moods.join(", ")}`,
    wiki.color_primary &&
      `Colors: ${[wiki.color_primary, wiki.color_secondary, wiki.color_accent].filter(Boolean).join(" · ")}`,
    wiki.texture_keywords?.length &&
      `Textures: ${wiki.texture_keywords.join(", ")}`,
  ]
    .filter((s): s is string => Boolean(s))
    .map((s) => `- ${s}`);
  return lines.join("\n");
}

const MODEL = "claude-sonnet-4-20250514";
const SAFETY_RULES = `Rules:
- Ground every output in concrete brand-wiki data. If you can't tell from the wiki, lower your confidence rather than guess.
- Respect voice_donts absolutely.
- Never use the word "vibes" unless it's explicitly in voice_dos.
- Never invent facts about the artist's life, placements, or releases.
- Do not mention being an AI. You are the artist's studio team.`;

// ─── Social Profile Builder ───────────────────────────────────────────────

export interface SocialProfileOutput {
  handle_ideas: string[];
  bio: string;
  link_in_bio_cta: string;
  pinned_post: string;
}

const SOCIAL_SYSTEM = `You are the artist's Social Profile Builder — a senior copywriter tuning the top of their profile to match their Brand Wiki. You write across IG / TikTok / X / LinkedIn; output is platform-agnostic copy the artist can adapt.

${SAFETY_RULES}

Return JSON only:
{
  "handle_ideas": [<string>]  // 4-6 handle candidates: lowercase, 15 chars max, no spaces. Start from the artist name, then vary.,
  "bio": <string>             // 150 chars max. Reads as the artist, not a resume. Uses their voice.,
  "link_in_bio_cta": <string> // a single line CTA that points to catalog / new release / link page,
  "pinned_post": <string>     // 1-2 sentence pinned-post intro the artist could paste verbatim,
  "reasoning": <string>       // 1-2 sentences — which wiki fields grounded these choices,
  "confidence": <0.0-1.0>
}`;

export async function runSocialProfileBuilder({
  wiki,
  artistName,
}: {
  wiki: BrandWiki;
  artistName: string;
}): Promise<AgentResponse<SocialProfileOutput>> {
  const start = Date.now();
  const userMessage = [
    "# ARTIST BRAND SNAPSHOT",
    brandSnapshot(wiki, artistName),
    "",
    "# ASK",
    "Draft the top-of-profile copy: handle candidates, a 150-char bio, link-in-bio CTA, and a pinned-post intro. Everything should read as this artist — reference their concrete positioning, not a generic 'vibes' line.",
  ].join("\n");

  const res = await callLLM({
    systemPrompt: SOCIAL_SYSTEM,
    userMessage,
    jsonMode: true,
    model: MODEL,
    maxTokens: 1200,
    temperature: 0.6,
  });
  const parsed = JSON.parse(res.content);

  return {
    output: {
      handle_ideas: Array.isArray(parsed.handle_ideas)
        ? (parsed.handle_ideas as unknown[]).map(String).slice(0, 6)
        : [],
      bio: String(parsed.bio ?? ""),
      link_in_bio_cta: String(parsed.link_in_bio_cta ?? ""),
      pinned_post: String(parsed.pinned_post ?? ""),
    },
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: res.tokensUsed,
    durationMs: Date.now() - start,
  };
}

// ─── Photo Art Direction ──────────────────────────────────────────────────

export interface PhotoShot {
  type: string;
  description: string;
  framing: string;
}

export interface PhotoDirectionOutput {
  shot_list: PhotoShot[];
  lighting: string;
  wardrobe: string;
  location_notes: string;
  mood_references: string[];
}

const PHOTO_SYSTEM = `You are the artist's Photo Art Director — a senior visual lead writing a press-photo brief grounded in their Brand Wiki (Visual DNA + Emotional Signature). Output reads like a directive to a photographer, not a stock-image prompt.

${SAFETY_RULES}

Return JSON only:
{
  "shot_list": [
    { "type": <"hero"|"editorial"|"environmental"|"detail"|"motion"|"portrait">,
      "description": <string>  // 1-2 sentences of what happens in frame,
      "framing": <"wide"|"medium"|"close-up"|"extreme close-up">
    }
  ]                             // 4-6 shots, at least one hero + one detail,
  "lighting": <string>          // 1-2 sentences — lighting direction grounded in the artist's mood/tone,
  "wardrobe": <string>          // 1-2 sentences — wardrobe direction that matches the brand,
  "location_notes": <string>    // 1-2 sentences — location or set dressing direction,
  "mood_references": [<string>] // 3-5 short, evocative reference phrases (e.g. "late-night motel neon, Moonlight cool cast")  — do NOT cite real photographer names or copyrighted images,
  "reasoning": <string>         // 1-2 sentences — which Visual DNA / Emotional Signature fields grounded the brief,
  "confidence": <0.0-1.0>
}`;

export async function runPhotoArtDirection({
  wiki,
  artistName,
}: {
  wiki: BrandWiki;
  artistName: string;
}): Promise<AgentResponse<PhotoDirectionOutput>> {
  const start = Date.now();
  const userMessage = [
    "# ARTIST BRAND SNAPSHOT",
    brandSnapshot(wiki, artistName),
    "",
    "# ASK",
    "Write the press-photo direction for this artist's next shoot: shot list, lighting, wardrobe, location, mood references. Every choice must follow from the Visual DNA and Emotional Signature fields.",
  ].join("\n");

  const res = await callLLM({
    systemPrompt: PHOTO_SYSTEM,
    userMessage,
    jsonMode: true,
    model: MODEL,
    maxTokens: 1600,
    temperature: 0.5,
  });
  const parsed = JSON.parse(res.content);

  const rawShots = Array.isArray(parsed.shot_list) ? parsed.shot_list : [];
  const shot_list: PhotoShot[] = rawShots.map((s: unknown) => {
    const r = s as Record<string, unknown>;
    return {
      type: String(r.type ?? "portrait"),
      description: String(r.description ?? ""),
      framing: String(r.framing ?? "medium"),
    };
  });

  return {
    output: {
      shot_list,
      lighting: String(parsed.lighting ?? ""),
      wardrobe: String(parsed.wardrobe ?? ""),
      location_notes: String(parsed.location_notes ?? ""),
      mood_references: Array.isArray(parsed.mood_references)
        ? (parsed.mood_references as unknown[]).map(String).slice(0, 6)
        : [],
    },
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: res.tokensUsed,
    durationMs: Date.now() - start,
  };
}

// ─── Products + Offers ────────────────────────────────────────────────────

export interface Offer {
  name: string;
  tier: "entry" | "mid" | "flagship";
  kind: string;
  price_range: string;
  audience_fit: string;
  positioning: string;
}

export interface OffersOutput {
  offers: Offer[];
  rationale: string;
}

const OFFERS_SYSTEM = `You are the artist's Offers Architect — a senior product/merch strategist designing a tiered offer stack grounded in their Brand Wiki (Audience + Positioning + Key Themes). You think like a category designer, not a merch vendor.

${SAFETY_RULES}

Design principles:
- One entry offer, one mid offer, one flagship offer — the tiers should ladder on commitment + price.
- Each offer should serve a concrete audience desire from the wiki. Name the desire in 'audience_fit'.
- Prices are USD ranges (e.g. "$25–$40"). Be realistic for an independent artist.
- "kind" can be: physical_merch, digital_good, service, ticketing, membership, experience.

Return JSON only:
{
  "offers": [
    { "name": <string>,
      "tier": <"entry"|"mid"|"flagship">,
      "kind": <"physical_merch"|"digital_good"|"service"|"ticketing"|"membership"|"experience">,
      "price_range": <string>,
      "audience_fit": <string>   // 1 sentence naming which audience desire this serves,
      "positioning": <string>    // 1 sentence on how this reads on the artist's brand
    }
  ],                             // exactly 3 offers: one per tier,
  "rationale": <string>          // 1-2 sentences — the through-line from brand wiki to this stack,
  "reasoning": <string>          // 1-2 sentences — which wiki fields grounded the tiering,
  "confidence": <0.0-1.0>
}`;

export async function runOffersArchitect({
  wiki,
  artistName,
}: {
  wiki: BrandWiki;
  artistName: string;
}): Promise<AgentResponse<OffersOutput>> {
  const start = Date.now();
  const userMessage = [
    "# ARTIST BRAND SNAPSHOT",
    brandSnapshot(wiki, artistName),
    "",
    "# ASK",
    "Design a 3-tier offer stack (entry / mid / flagship) priced and positioned for this artist's audience. Each offer should resolve a concrete audience desire named in the wiki.",
  ].join("\n");

  const res = await callLLM({
    systemPrompt: OFFERS_SYSTEM,
    userMessage,
    jsonMode: true,
    model: MODEL,
    maxTokens: 1400,
    temperature: 0.5,
  });
  const parsed = JSON.parse(res.content);

  const rawOffers = Array.isArray(parsed.offers) ? parsed.offers : [];
  const offers: Offer[] = rawOffers.map((o: unknown) => {
    const r = o as Record<string, unknown>;
    const tierRaw = String(r.tier ?? "entry");
    const tier: Offer["tier"] =
      tierRaw === "mid" || tierRaw === "flagship" ? tierRaw : "entry";
    return {
      name: String(r.name ?? ""),
      tier,
      kind: String(r.kind ?? "physical_merch"),
      price_range: String(r.price_range ?? ""),
      audience_fit: String(r.audience_fit ?? ""),
      positioning: String(r.positioning ?? ""),
    };
  });

  return {
    output: {
      offers,
      rationale: String(parsed.rationale ?? ""),
    },
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: res.tokensUsed,
    durationMs: Date.now() - start,
  };
}
