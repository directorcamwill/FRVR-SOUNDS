"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { GENRES, MOODS, MUSICAL_KEYS, TEMPO_FEELS } from "@/lib/utils/constants";
import type { Song } from "@/types/song";

interface MetadataFormValues {
  title: string;
  genre: string | null;
  sub_genre: string | null;
  description: string | null;
  bpm: number | null;
  key: string | null;
  tempo_feel: string | null;
  energy_level: number | null;
  has_vocals: boolean;
  vocal_gender: string | null;
  language: string;
  explicit_content: boolean;
  moods: string;
  tags: string;
  similar_artists: string;
  lyrics_themes: string;
  one_stop: boolean;
  instrumental_available: boolean;
  lyrics: string | null;
}

interface MetadataFormProps {
  song: Song;
  onSaved?: () => void;
}

export function MetadataForm({ song, onSaved }: MetadataFormProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const metadata = Array.isArray(song.song_metadata)
    ? song.song_metadata[0]
    : song.song_metadata;

  const { register, watch, setValue, getValues } = useForm<MetadataFormValues>({
    defaultValues: {
      title: song.title,
      genre: metadata?.genre || null,
      sub_genre: metadata?.sub_genre || null,
      description: metadata?.description || null,
      bpm: metadata?.bpm || null,
      key: metadata?.key || null,
      tempo_feel: metadata?.tempo_feel || null,
      energy_level: metadata?.energy_level || null,
      has_vocals: metadata?.has_vocals ?? true,
      vocal_gender: metadata?.vocal_gender || null,
      language: metadata?.language || "en",
      explicit_content: metadata?.explicit_content ?? false,
      moods: metadata?.moods?.join(", ") || "",
      tags: metadata?.tags?.join(", ") || "",
      similar_artists: metadata?.similar_artists?.join(", ") || "",
      lyrics_themes: metadata?.lyrics_themes?.join(", ") || "",
      one_stop: metadata?.one_stop ?? false,
      instrumental_available: metadata?.instrumental_available ?? false,
      lyrics: metadata?.lyrics || null,
    },
  });

  const hasVocals = watch("has_vocals");

  const save = useCallback(
    async (data: MetadataFormValues) => {
      setSaveStatus("saving");
      try {
        const payload: Record<string, unknown> = {
          title: data.title,
          genre: data.genre || null,
          sub_genre: data.sub_genre || null,
          description: data.description || null,
          bpm: data.bpm || null,
          key: data.key || null,
          tempo_feel: data.tempo_feel || null,
          energy_level: data.energy_level || null,
          has_vocals: data.has_vocals ?? true,
          vocal_gender: data.has_vocals ? (data.vocal_gender || null) : null,
          language: data.language || "en",
          explicit_content: data.explicit_content ?? false,
          moods: data.moods
            ? data.moods.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          tags: data.tags
            ? data.tags.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          similar_artists: data.similar_artists
            ? data.similar_artists.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          lyrics_themes: data.lyrics_themes
            ? data.lyrics_themes.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          one_stop: data.one_stop ?? false,
          instrumental_available: data.instrumental_available ?? false,
          lyrics: data.lyrics || null,
        };

        await fetch(`/api/songs/${song.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        setSaveStatus("saved");
        // Don't call onSaved here — it causes a refetch that resets the form mid-typing
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("idle");
      }
    },
    [song.id]
  );

  // Debounced auto-save: only save 1.5s after user stops typing
  useEffect(() => {
    const subscription = watch(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        save(getValues());
      }, 1500);
    });
    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [watch, save, getValues]);

  return (
    <div className="space-y-6">
      {/* Save indicator */}
      <div className="flex items-center justify-end">
        <span
          className={`text-xs transition-opacity ${saveStatus === "idle" ? "opacity-0" : "opacity-100"} ${saveStatus === "saving" ? "text-amber-400" : "text-emerald-400"}`}
        >
          {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : ""}
        </span>
      </div>

      {/* Basic Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-[#A3A3A3] uppercase tracking-wider">
          Basic Info
        </h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Genre</Label>
              <Select
                value={watch("genre") || ""}
                onValueChange={(val) => setValue("genre", val || null, { shouldDirty: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sub_genre">Sub-genre</Label>
              <Input id="sub_genre" {...register("sub_genre")} placeholder="e.g. Lo-Fi Hip-Hop" />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Brief description of the track..."
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* Musical Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-[#A3A3A3] uppercase tracking-wider">
          Musical Info
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="bpm">BPM</Label>
            <Input
              id="bpm"
              type="number"
              {...register("bpm")}
              placeholder="120"
            />
          </div>
          <div>
            <Label>Key</Label>
            <Select
              value={watch("key") || ""}
              onValueChange={(val) => setValue("key", val || null, { shouldDirty: true })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select key" />
              </SelectTrigger>
              <SelectContent>
                {MUSICAL_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tempo Feel</Label>
            <Select
              value={watch("tempo_feel") || ""}
              onValueChange={(val) => setValue("tempo_feel", val || null, { shouldDirty: true })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tempo" />
              </SelectTrigger>
              <SelectContent>
                {TEMPO_FEELS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="energy_level">Energy Level (1-10)</Label>
            <Input
              id="energy_level"
              type="number"
              min={1}
              max={10}
              {...register("energy_level")}
              placeholder="5"
            />
          </div>
        </div>
      </section>

      {/* Vocals */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-[#A3A3A3] uppercase tracking-wider">
          Vocals
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Has Vocals</Label>
            <Switch
              checked={hasVocals}
              onCheckedChange={(checked) => setValue("has_vocals", !!checked, { shouldDirty: true })}
            />
          </div>
          {hasVocals && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vocal Gender</Label>
                <Select
                  value={watch("vocal_gender") || ""}
                  onValueChange={(val) => setValue("vocal_gender", val || null, { shouldDirty: true })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Input id="language" {...register("language")} placeholder="en" />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label>Explicit Content</Label>
            <Switch
              checked={watch("explicit_content")}
              onCheckedChange={(checked) =>
                setValue("explicit_content", !!checked, { shouldDirty: true })
              }
            />
          </div>
        </div>
      </section>

      {/* Tags & Moods */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-[#A3A3A3] uppercase tracking-wider">
          Tags & Moods
        </h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="moods">
              Moods <span className="text-[#555] font-normal">(comma-separated)</span>
            </Label>
            <Input
              id="moods"
              {...register("moods")}
              placeholder={MOODS.slice(0, 4).join(", ")}
            />
          </div>
          <div>
            <Label htmlFor="tags">
              Tags <span className="text-[#555] font-normal">(comma-separated)</span>
            </Label>
            <Input
              id="tags"
              {...register("tags")}
              placeholder="driving, cinematic, anthem"
            />
          </div>
          <div>
            <Label htmlFor="similar_artists">
              Similar Artists{" "}
              <span className="text-[#555] font-normal">(comma-separated)</span>
            </Label>
            <Input
              id="similar_artists"
              {...register("similar_artists")}
              placeholder="The Weeknd, Drake, SZA"
            />
          </div>
          <div>
            <Label htmlFor="lyrics_themes">
              Lyrics Themes{" "}
              <span className="text-[#555] font-normal">(comma-separated)</span>
            </Label>
            <Input
              id="lyrics_themes"
              {...register("lyrics_themes")}
              placeholder="love, freedom, resilience"
            />
          </div>
        </div>
      </section>

      {/* Licensing */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-[#A3A3A3] uppercase tracking-wider">
          Licensing
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>One-Stop Licensing</Label>
            <Switch
              checked={watch("one_stop")}
              onCheckedChange={(checked) =>
                setValue("one_stop", !!checked, { shouldDirty: true })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Instrumental Available</Label>
            <Switch
              checked={watch("instrumental_available")}
              onCheckedChange={(checked) =>
                setValue("instrumental_available", !!checked, { shouldDirty: true })
              }
            />
          </div>
        </div>
      </section>

      {/* Lyrics */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-[#A3A3A3] uppercase tracking-wider">
          Lyrics
        </h3>
        <Textarea
          {...register("lyrics")}
          placeholder="Paste lyrics here..."
          rows={8}
        />
      </section>
    </div>
  );
}
