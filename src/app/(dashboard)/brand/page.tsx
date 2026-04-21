"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ConfidencePill } from "@/components/ui/motion";
import {
  Sparkles,
  Save,
  Loader2,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  BrandFocus,
  BrandGuidance,
  BrandWiki,
  SyncFormatTarget,
} from "@/types/brand";

const FORMAT_OPTIONS: SyncFormatTarget[] = [
  "tv_episode",
  "film",
  "ad_30",
  "ad_60",
  "ad_15",
  "trailer",
  "game",
  "web_social",
  "podcast",
  "library",
];

function toArray(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// Fields the Brand Director sometimes proposes as comma-strings; they map
// to Postgres TEXT[] columns. Coerce when applying a suggested edit.
const ARRAY_FIELDS = new Set<string>([
  "audience_pain_points",
  "tone_descriptors",
  "voice_dos",
  "voice_donts",
  "texture_keywords",
  "press_photo_urls",
  "sonic_moods",
  "sonic_key_preferences",
  "sonic_texture_keywords",
  "sync_format_targets",
  "sync_library_targets",
  "avoid_sync_formats",
]);

const NUMBER_FIELDS = new Set<string>(["sonic_bpm_min", "sonic_bpm_max"]);

function coerceSuggestionForField(field: string, value: string): unknown {
  if (ARRAY_FIELDS.has(field)) return toArray(value);
  if (NUMBER_FIELDS.has(field)) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
  }
  return value;
}

export default function BrandPage() {
  const [wiki, setWiki] = useState<BrandWiki | null>(null);
  const [artistName, setArtistName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [guidance, setGuidance] = useState<BrandGuidance | null>(null);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [activeFocus, setActiveFocus] = useState<BrandFocus | undefined>(
    undefined
  );

  const fetchWiki = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brand-wiki");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load brand wiki");
      }
      const data = await res.json();
      setWiki(data.wiki);
      setArtistName(data.artist_name ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWiki();
  }, [fetchWiki]);

  const saveWiki = async (patch: Partial<BrandWiki>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/brand-wiki", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Save failed");
      }
      const data = await res.json();
      setWiki(data.wiki);
      toast.success("Saved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const runDirector = async (focus?: BrandFocus) => {
    setGuidanceLoading(true);
    setActiveFocus(focus);
    try {
      const res = await fetch("/api/agents/brand-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Director failed");
      }
      const data = await res.json();
      setGuidance(data.guidance);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Director failed");
    } finally {
      setGuidanceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error && !wiki) {
    return (
      <div className="flex items-start gap-2 text-red-400">
        <AlertCircle className="size-4 mt-0.5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!wiki) return null;

  const pct = wiki.completeness_pct;
  const tone =
    pct >= 85 ? "emerald" : pct >= 60 ? "amber" : pct >= 30 ? "red" : "chrome";
  const toneBar = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    chrome: "bg-[#c0c8d8]",
  }[tone];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#8892a4]">
                Artist Brand Wiki
              </p>
              <h1 className="text-2xl font-semibold text-white tracking-tight mt-1">
                {artistName || "Your brand"}
              </h1>
              <p className="text-sm text-[#A3A3A3] mt-1 max-w-xl">
                Every growth agent (Content Director, Outreach, Content + Sync
                Loop) reads from this wiki. The sharper this gets, the
                sharper every downstream output gets.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-[#8892a4]">
                  Completeness
                </p>
                <p className="text-2xl font-bold tabular-nums text-white">
                  {pct}%
                </p>
              </div>
              <Button
                onClick={() => runDirector(activeFocus)}
                disabled={guidanceLoading}
              >
                {guidanceLoading ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="size-4 mr-2" />
                )}
                {guidance ? "Re-run Director" : "Get Director guidance"}
              </Button>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#1A1A1A] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full motion-safe:transition-all motion-safe:duration-700",
                toneBar
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {guidance && (
        <GuidancePanel
          guidance={guidance}
          onApplyEdit={(field, value) =>
            saveWiki({
              [field]: coerceSuggestionForField(field, value),
            } as Partial<BrandWiki>)
          }
          onDismiss={() => setGuidance(null)}
        />
      )}

      <Tabs
        defaultValue="identity"
        onValueChange={(v) => setActiveFocus(v as BrandFocus)}
      >
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="tone">Tone</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="sonic">Sonic</TabsTrigger>
          <TabsTrigger value="sync_positioning">Sync</TabsTrigger>
        </TabsList>

        {/* key={wiki.updated_at} forces tabs to remount when the wiki changes
            (e.g. via Brand Director "Apply this") so local form state reseeds
            from the fresh wiki instead of keeping stale initial values. */}
        <TabsContent value="identity">
          <IdentityTab
            key={`identity-${wiki.updated_at}`}
            wiki={wiki}
            onSave={saveWiki}
            saving={saving}
          />
        </TabsContent>
        <TabsContent value="audience">
          <AudienceTab
            key={`audience-${wiki.updated_at}`}
            wiki={wiki}
            onSave={saveWiki}
            saving={saving}
          />
        </TabsContent>
        <TabsContent value="tone">
          <ToneTab
            key={`tone-${wiki.updated_at}`}
            wiki={wiki}
            onSave={saveWiki}
            saving={saving}
          />
        </TabsContent>
        <TabsContent value="visual">
          <VisualTab
            key={`visual-${wiki.updated_at}`}
            wiki={wiki}
            onSave={saveWiki}
            saving={saving}
          />
        </TabsContent>
        <TabsContent value="sonic">
          <SonicTab
            key={`sonic-${wiki.updated_at}`}
            wiki={wiki}
            onSave={saveWiki}
            saving={saving}
          />
        </TabsContent>
        <TabsContent value="sync_positioning">
          <SyncTab
            key={`sync-${wiki.updated_at}`}
            wiki={wiki}
            onSave={saveWiki}
            saving={saving}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ───────────────────────── Guidance panel ─────────────────────────

function GuidancePanel({
  guidance,
  onApplyEdit,
  onDismiss,
}: {
  guidance: BrandGuidance;
  onApplyEdit: (field: string, value: string) => void;
  onDismiss: () => void;
}) {
  return (
    <Card className="border-red-500/20 bg-red-500/[0.02]">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-4 text-red-500" />
            Brand Director
          </CardTitle>
          <p className="text-xs text-[#A3A3A3] mt-1">{guidance.reasoning}</p>
        </div>
        <div className="flex items-center gap-2">
          {guidance.confidence != null && (
            <ConfidencePill
              score={guidance.confidence}
              showLabel={false}
            />
          )}
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-[#1A1A1A] bg-black/40 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8892a4] mb-1">
            Next question
          </p>
          <p className="text-sm text-white">{guidance.next_question}</p>
          {guidance.next_question_choices &&
            guidance.next_question_choices.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {guidance.next_question_choices.map((c) => (
                  <Badge
                    key={c}
                    variant="outline"
                    className="text-[10px]"
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            )}
        </div>

        {guidance.missing_critical.length > 0 && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-red-300 mb-1">
              {guidance.missing_critical.length} critical gap
              {guidance.missing_critical.length === 1 ? "" : "s"}
            </p>
            <div className="flex flex-wrap gap-1">
              {guidance.missing_critical.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center rounded border border-red-500/30 bg-red-500/10 text-red-300 px-2 py-0.5 text-[10px]"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {guidance.suggested_edits.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#A3A3A3]">
              Suggested edits
            </p>
            {guidance.suggested_edits.map((e, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#1A1A1A] p-3 space-y-2"
              >
                <p className="text-[10px] font-mono text-[#8892a4]">
                  {e.field}
                </p>
                {e.current && (
                  <p className="text-xs text-[#555] line-through">
                    {e.current}
                  </p>
                )}
                <p className="text-sm text-white">{e.suggestion}</p>
                <p className="text-[10px] italic text-[#666]">
                  {e.reasoning}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApplyEdit(e.field, e.suggestion)}
                >
                  <CheckCircle2 className="size-3.5 mr-1.5" />
                  Apply this
                </Button>
              </div>
            ))}
          </div>
        )}

        {guidance.bio_variants && (
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#A3A3A3]">
              Bio variants
            </p>
            {(["short", "medium", "long"] as const).map((len) => (
              <div
                key={len}
                className="rounded-lg border border-[#1A1A1A] p-3 space-y-2"
              >
                <p className="text-[10px] font-mono uppercase text-[#8892a4]">
                  bio_{len}
                </p>
                <p className="text-sm text-white">
                  {guidance.bio_variants![len]}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onApplyEdit(`bio_${len}`, guidance.bio_variants![len])
                  }
                >
                  <CheckCircle2 className="size-3.5 mr-1.5" />
                  Save as bio_{len}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ───────────────────────── Tab components ─────────────────────────

interface TabProps {
  wiki: BrandWiki;
  onSave: (patch: Partial<BrandWiki>) => Promise<void>;
  saving: boolean;
}

function FormWrapper({
  title,
  children,
  onSave,
  saving,
}: {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          ) : (
            <Save className="size-3.5 mr-1.5" />
          )}
          Save
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function IdentityTab({ wiki, onSave, saving }: TabProps) {
  const [niche, setNiche] = useState(wiki.niche ?? "");
  const [elevator, setElevator] = useState(wiki.elevator_pitch ?? "");
  const [origin, setOrigin] = useState(wiki.origin_story ?? "");
  const [bioShort, setBioShort] = useState(wiki.bio_short ?? "");
  const [bioMedium, setBioMedium] = useState(wiki.bio_medium ?? "");
  const [bioLong, setBioLong] = useState(wiki.bio_long ?? "");

  return (
    <FormWrapper
      title="Identity"
      saving={saving}
      onSave={() =>
        onSave({
          niche,
          elevator_pitch: elevator,
          origin_story: origin,
          bio_short: bioShort,
          bio_medium: bioMedium,
          bio_long: bioLong,
        })
      }
    >
      <div className="space-y-2">
        <Label>Niche</Label>
        <Input
          placeholder="Dark cinematic R&B for prestige TV"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Elevator pitch (1–2 sentences)</Label>
        <Textarea
          rows={2}
          placeholder="I make the sound of 2am — moody, slow-burning R&B for indie films and prestige dramas."
          value={elevator}
          onChange={(e) => setElevator(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Origin story</Label>
        <Textarea
          rows={5}
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Bio — short (~150 chars)</Label>
          <Textarea
            rows={3}
            value={bioShort}
            onChange={(e) => setBioShort(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Bio — medium (~300 chars)</Label>
          <Textarea
            rows={4}
            value={bioMedium}
            onChange={(e) => setBioMedium(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Bio — long (~600 chars)</Label>
          <Textarea
            rows={6}
            value={bioLong}
            onChange={(e) => setBioLong(e.target.value)}
          />
        </div>
      </div>
    </FormWrapper>
  );
}

function AudienceTab({ wiki, onSave, saving }: TabProps) {
  const [primary, setPrimary] = useState(wiki.primary_audience ?? "");
  const [secondary, setSecondary] = useState(wiki.secondary_audience ?? "");
  const [pain, setPain] = useState(wiki.audience_pain_points.join(", "));

  return (
    <FormWrapper
      title="Audience"
      saving={saving}
      onSave={() =>
        onSave({
          primary_audience: primary,
          secondary_audience: secondary,
          audience_pain_points: toArray(pain),
        })
      }
    >
      <div className="space-y-2">
        <Label>Primary audience</Label>
        <Input
          placeholder="Indie film music supervisors, 30–45"
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Secondary audience</Label>
        <Input
          placeholder="Streaming-era R&B listeners 25–40 on taste-maker playlists"
          value={secondary}
          onChange={(e) => setSecondary(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Audience pain points (comma separated)</Label>
        <Textarea
          rows={3}
          placeholder="can't find one-stop tracks, budgets shrinking, AI-generated library saturation"
          value={pain}
          onChange={(e) => setPain(e.target.value)}
        />
      </div>
    </FormWrapper>
  );
}

function ToneTab({ wiki, onSave, saving }: TabProps) {
  const [desc, setDesc] = useState(wiki.tone_descriptors.join(", "));
  const [dos, setDos] = useState(wiki.voice_dos.join(", "));
  const [donts, setDonts] = useState(wiki.voice_donts.join(", "));
  const [core, setCore] = useState(wiki.core_messaging ?? "");

  return (
    <FormWrapper
      title="Tone + voice"
      saving={saving}
      onSave={() =>
        onSave({
          tone_descriptors: toArray(desc),
          voice_dos: toArray(dos),
          voice_donts: toArray(donts),
          core_messaging: core,
        })
      }
    >
      <div className="space-y-2">
        <Label>Tone descriptors (comma separated)</Label>
        <Input
          placeholder="cinematic, measured, confident, dark"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Voice dos</Label>
        <Textarea
          rows={3}
          placeholder="let lines breathe, reference real placements, use concrete imagery"
          value={dos}
          onChange={(e) => setDos(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Voice don&apos;ts</Label>
        <Textarea
          rows={3}
          placeholder="hype words, exclamation points, generic 'vibes'"
          value={donts}
          onChange={(e) => setDonts(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Core messaging</Label>
        <Textarea
          rows={3}
          placeholder="Core message all content returns to — what do you stand for?"
          value={core}
          onChange={(e) => setCore(e.target.value)}
        />
      </div>
    </FormWrapper>
  );
}

function VisualTab({ wiki, onSave, saving }: TabProps) {
  const [cp, setCp] = useState(wiki.color_primary ?? "");
  const [cs, setCs] = useState(wiki.color_secondary ?? "");
  const [ca, setCa] = useState(wiki.color_accent ?? "");
  const [fh, setFh] = useState(wiki.font_heading ?? "");
  const [fb, setFb] = useState(wiki.font_body ?? "");
  const [tex, setTex] = useState(wiki.texture_keywords.join(", "));
  const [logo, setLogo] = useState(wiki.logo_url ?? "");
  const [icon, setIcon] = useState(wiki.icon_url ?? "");
  const [photos, setPhotos] = useState(wiki.press_photo_urls.join(", "));

  return (
    <FormWrapper
      title="Visual identity"
      saving={saving}
      onSave={() =>
        onSave({
          color_primary: cp,
          color_secondary: cs,
          color_accent: ca,
          font_heading: fh,
          font_body: fb,
          texture_keywords: toArray(tex),
          logo_url: logo,
          icon_url: icon,
          press_photo_urls: toArray(photos),
        })
      }
    >
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Primary color</Label>
          <Input
            placeholder="#DC2626"
            value={cp}
            onChange={(e) => setCp(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Secondary color</Label>
          <Input
            placeholder="#22d3ee"
            value={cs}
            onChange={(e) => setCs(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Accent color</Label>
          <Input
            placeholder="#c0c8d8"
            value={ca}
            onChange={(e) => setCa(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Heading font</Label>
          <Input
            placeholder="Inter"
            value={fh}
            onChange={(e) => setFh(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Body font</Label>
          <Input
            placeholder="Inter"
            value={fb}
            onChange={(e) => setFb(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Texture keywords (comma separated)</Label>
        <Input
          placeholder="chrome, film grain, dark gloss"
          value={tex}
          onChange={(e) => setTex(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Logo URL</Label>
          <Input value={logo} onChange={(e) => setLogo(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Icon URL</Label>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Press photo URLs (comma separated)</Label>
        <Textarea
          rows={3}
          value={photos}
          onChange={(e) => setPhotos(e.target.value)}
        />
      </div>
    </FormWrapper>
  );
}

function SonicTab({ wiki, onSave, saving }: TabProps) {
  const [g1, setG1] = useState(wiki.sonic_genre_primary ?? "");
  const [g2, setG2] = useState(wiki.sonic_genre_secondary ?? "");
  const [moods, setMoods] = useState(wiki.sonic_moods.join(", "));
  const [bmin, setBmin] = useState<string>(
    wiki.sonic_bpm_min?.toString() ?? ""
  );
  const [bmax, setBmax] = useState<string>(
    wiki.sonic_bpm_max?.toString() ?? ""
  );
  const [keys, setKeys] = useState(wiki.sonic_key_preferences.join(", "));
  const [tex, setTex] = useState(wiki.sonic_texture_keywords.join(", "));
  const [refs, setRefs] = useState(
    JSON.stringify(wiki.reference_tracks ?? [], null, 2)
  );

  return (
    <FormWrapper
      title="Sonic identity"
      saving={saving}
      onSave={() => {
        let parsedRefs = [];
        try {
          parsedRefs = JSON.parse(refs || "[]");
        } catch {
          toast.error("Reference tracks must be valid JSON");
          return;
        }
        onSave({
          sonic_genre_primary: g1,
          sonic_genre_secondary: g2,
          sonic_moods: toArray(moods),
          sonic_bpm_min: bmin ? parseInt(bmin, 10) : null,
          sonic_bpm_max: bmax ? parseInt(bmax, 10) : null,
          sonic_key_preferences: toArray(keys),
          sonic_texture_keywords: toArray(tex),
          reference_tracks: parsedRefs,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Primary genre</Label>
          <Input
            placeholder="Dark R&B"
            value={g1}
            onChange={(e) => setG1(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Secondary genre</Label>
          <Input
            placeholder="Ambient soul"
            value={g2}
            onChange={(e) => setG2(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Moods (comma separated)</Label>
        <Input
          placeholder="tense, moody, late-night, cinematic"
          value={moods}
          onChange={(e) => setMoods(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>BPM min</Label>
          <Input
            type="number"
            value={bmin}
            onChange={(e) => setBmin(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>BPM max</Label>
          <Input
            type="number"
            value={bmax}
            onChange={(e) => setBmax(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Preferred keys (comma separated)</Label>
        <Input
          placeholder="C minor, F# minor, A minor"
          value={keys}
          onChange={(e) => setKeys(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Sonic texture keywords</Label>
        <Input
          placeholder="warm tape, sub-bass heavy, airy reverb"
          value={tex}
          onChange={(e) => setTex(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>
          Reference tracks (JSON: [&#123; artist, title, spotify_url, why &#125;])
        </Label>
        <Textarea
          rows={6}
          className="font-mono text-xs"
          value={refs}
          onChange={(e) => setRefs(e.target.value)}
        />
      </div>
    </FormWrapper>
  );
}

function SyncTab({ wiki, onSave, saving }: TabProps) {
  const [targets, setTargets] = useState<SyncFormatTarget[]>(
    wiki.sync_format_targets
  );
  const [libraries, setLibraries] = useState(
    wiki.sync_library_targets.join(", ")
  );
  const [avoid, setAvoid] = useState<SyncFormatTarget[]>(
    wiki.avoid_sync_formats
  );

  const toggle = (
    arr: SyncFormatTarget[],
    set: (v: SyncFormatTarget[]) => void,
    v: SyncFormatTarget
  ) => {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  return (
    <FormWrapper
      title="Sync positioning"
      saving={saving}
      onSave={() =>
        onSave({
          sync_format_targets: targets,
          sync_library_targets: toArray(libraries),
          avoid_sync_formats: avoid,
        })
      }
    >
      <div className="space-y-2">
        <Label>Format targets</Label>
        <div className="flex flex-wrap gap-1.5">
          {FORMAT_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggle(targets, setTargets, f)}
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
                targets.includes(f)
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-[#1A1A1A] text-[#A3A3A3] hover:border-[#333] hover:text-white"
              )}
            >
              {f.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Formats to avoid</Label>
        <div className="flex flex-wrap gap-1.5">
          {FORMAT_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggle(avoid, setAvoid, f)}
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
                avoid.includes(f)
                  ? "border-[#c0c8d8]/40 bg-[#c0c8d8]/10 text-[#c0c8d8]"
                  : "border-[#1A1A1A] text-[#A3A3A3] hover:border-[#333] hover:text-white"
              )}
            >
              {f.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Target libraries (comma separated)</Label>
        <Textarea
          rows={3}
          placeholder="Heavy Hitters, Audiio, Musicbed, APM"
          value={libraries}
          onChange={(e) => setLibraries(e.target.value)}
        />
      </div>
    </FormWrapper>
  );
}
