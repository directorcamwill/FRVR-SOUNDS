"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Pause, Play, Search as SearchIcon } from "lucide-react";

interface Song {
  id: string;
  song_title: string;
  artist_name: string;
  genre: string | null;
  moods: string[] | null;
  bpm: number | null;
  key: string | null;
  vocal_type: string | null;
  is_one_stop: boolean | null;
  signed_audio_url: string | null;
}

const COMMON_MOODS = [
  "melancholic", "hopeful", "dark", "uplifting", "tense", "warm",
  "intimate", "driving", "cinematic", "romantic", "nostalgic", "playful",
];

export default function CatalogSearchPage() {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [moods, setMoods] = useState<Set<string>>(new Set());
  const [bpmMin, setBpmMin] = useState("");
  const [bpmMax, setBpmMax] = useState("");
  const [vocal, setVocal] = useState<"" | "vocal" | "instrumental">("");
  const [oneStop, setOneStop] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (genre) params.set("genre", genre);
      if (moods.size > 0) params.set("moods", Array.from(moods).join(","));
      if (bpmMin) params.set("bpm_min", bpmMin);
      if (bpmMax) params.set("bpm_max", bpmMax);
      if (vocal) params.set("vocal", vocal);
      if (oneStop) params.set("one_stop", "true");
      const r = await fetch(`/api/catalog/search?${params}`);
      const data = await r.json();
      setSongs(data.songs ?? []);
    } catch {
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, [q, genre, moods, bpmMin, bpmMax, vocal, oneStop]);

  // Debounced auto-search on filter changes
  useEffect(() => {
    const t = setTimeout(() => {
      if (q || genre || moods.size > 0 || bpmMin || bpmMax || vocal || oneStop) {
        search();
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q, genre, moods, bpmMin, bpmMax, vocal, oneStop, search]);

  const play = (song: Song) => {
    if (!song.signed_audio_url) return;
    if (playingId === song.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    audioRef.current = new Audio(song.signed_audio_url);
    audioRef.current.play();
    audioRef.current.addEventListener("ended", () => setPlayingId(null));
    setPlayingId(song.id);
  };

  useEffect(() => () => audioRef.current?.pause(), []);

  const toggleMood = (m: string) => {
    setMoods((prev) => {
      const n = new Set(prev);
      if (n.has(m)) n.delete(m);
      else n.add(m);
      return n;
    });
  };

  return (
    <div className="min-h-screen relative">
      <div aria-hidden className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 70% at 30% 20%, rgba(220, 38, 38, 0.15) 0%, transparent 70%),
              linear-gradient(180deg, #050505 0%, #000000 100%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pt-28 pb-32">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-white/50 hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="size-3" />
          Lobby
        </Link>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-[10px] uppercase tracking-[0.5em] text-[#DC2626] mb-4"
        >
          Search
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="font-display text-[clamp(2.5rem,7vw,5rem)] font-black leading-[0.9] tracking-[-0.03em] chromatic text-white"
        >
          <span className="italic font-normal text-[0.4em] text-[#DC2626] tracking-[0.02em] mr-2">
            The
          </span>
          <span>Catalog</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-4 max-w-xl text-base md:text-lg font-display italic text-white/65"
        >
          For the briefs on deadline. Filter by mood, BPM, genre, and more.
        </motion.p>

        {/* Search bar */}
        <div className="mt-12 relative">
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or artist…"
            className="w-full pl-14 pr-5 py-5 text-lg rounded-full bg-black/60 border border-white/10 text-white placeholder:text-white/30 font-display focus:outline-none focus:border-[#DC2626]/50"
          />
        </div>

        {/* Filters */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FilterGroup label="Genre">
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Any"
              className="w-full bg-[#111] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#DC2626]/50"
            />
          </FilterGroup>
          <FilterGroup label="BPM">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={bpmMin}
                onChange={(e) => setBpmMin(e.target.value)}
                placeholder="min"
                className="w-full bg-[#111] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#DC2626]/50"
              />
              <span className="text-white/30">—</span>
              <input
                type="number"
                value={bpmMax}
                onChange={(e) => setBpmMax(e.target.value)}
                placeholder="max"
                className="w-full bg-[#111] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#DC2626]/50"
              />
            </div>
          </FilterGroup>
          <FilterGroup label="Vocals">
            <div className="flex gap-1">
              {(
                [
                  ["", "Any"],
                  ["vocal", "Vocal"],
                  ["instrumental", "Instrumental"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setVocal(v)}
                  className="flex-1 px-2 py-2 rounded text-[10px] uppercase tracking-[0.2em] transition-colors"
                  style={
                    vocal === v
                      ? { background: "#DC2626", color: "#fff" }
                      : { background: "#111", color: "rgba(255,255,255,0.6)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup label="License">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={oneStop}
                onChange={(e) => setOneStop(e.target.checked)}
                className="size-4 accent-[#DC2626]"
              />
              <span className="text-sm text-white/70">One-Stop only</span>
            </label>
          </FilterGroup>
        </div>

        {/* Mood chips */}
        <div className="mt-6">
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 mb-3">
            Moods
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_MOODS.map((m) => {
              const on = moods.has(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleMood(m)}
                  className="text-[10px] uppercase tracking-[0.25em] px-3 py-2 rounded-full border transition-colors"
                  style={
                    on
                      ? {
                          borderColor: "#DC2626",
                          background: "rgba(220,38,38,0.15)",
                          color: "#fff",
                        }
                      : {
                          borderColor: "rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.6)",
                        }
                  }
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="mt-12">
          {loading ? (
            <p className="text-sm text-white/40 italic breath">Searching…</p>
          ) : !hasSearched ? (
            <p className="text-sm text-white/40 italic">
              Start typing or pick a filter above.
            </p>
          ) : songs.length === 0 ? (
            <p className="text-sm text-white/40 italic">
              Nothing matches. Loosen the filters?
            </p>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-4">
                {songs.length} {songs.length === 1 ? "result" : "results"}
              </p>
              <div className="border-t border-white/5">
                {songs.map((song, i) => (
                  <SearchRow
                    key={song.id}
                    song={song}
                    index={i}
                    isPlaying={playingId === song.id}
                    onPlay={() => play(song)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {playingId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 flex items-center gap-3">
          <span
            className="size-2 rounded-full live-dot"
            style={{ background: "#DC2626", boxShadow: "0 0 10px #DC2626" }}
          />
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/70">
            Now Playing
          </span>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}

function SearchRow({
  song,
  index,
  isPlaying,
  onPlay,
}: {
  song: Song;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.3) }}
      className="group border-b border-white/5 py-4 hover:bg-white/[0.02] transition-colors"
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onPlay}
          className="shrink-0 size-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 transition-all"
          style={isPlaying ? { background: "#DC2626", borderColor: "#DC2626" } : undefined}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-3.5 text-white" fill="white" />
          ) : (
            <Play className="size-3.5 text-white/80 translate-x-px" fill="currentColor" />
          )}
        </button>

        <Link
          href={`/catalog/song/${song.id}`}
          className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
        >
          <h3 className="font-display text-lg font-medium text-white truncate">
            {song.song_title}
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            {song.artist_name}
            {song.genre && (
              <>
                <span className="mx-2 text-white/20">·</span>
                <span>{song.genre}</span>
              </>
            )}
          </p>
        </Link>

        <div className="hidden md:flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-white/40 shrink-0">
          {song.bpm && <span className="tabular-nums">{song.bpm} BPM</span>}
          {song.key && (
            <>
              <span className="opacity-40">·</span>
              <span>{song.key}</span>
            </>
          )}
          {song.is_one_stop && (
            <>
              <span className="opacity-40">·</span>
              <span className="text-[#DC2626]">One-Stop</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
