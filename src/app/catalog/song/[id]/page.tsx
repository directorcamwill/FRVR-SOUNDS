"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, BookmarkPlus, Check, Lock, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { VisitorGateModal, useVisitorUnlock } from "@/components/catalog/visitor-gate";
import { Waveform } from "@/components/catalog/waveform";

interface RoomRef {
  slug: string;
  name: string;
  accent_color: string | null;
}

interface Analysis {
  waveform_peaks: number[] | null;
  duration_sec: number | null;
  lufs_integrated: number | null;
  true_peak_db: number | null;
  dynamic_range: number | null;
  detected_bpm: number | null;
  detected_bpm_confidence: number | null;
  detected_key: string | null;
  detected_key_confidence: number | null;
  analyzer_version: string | null;
}

interface Song {
  id: string;
  song_title: string;
  artist_name: string;
  genre: string | null;
  sub_genre: string | null;
  moods: string[] | null;
  bpm: number | null;
  key: string | null;
  vocal_type: string | null;
  is_one_stop: boolean | null;
  signed_audio_url: string | null;
  deal_type: string;
  rooms: RoomRef[];
  analysis: Analysis | null;
}

interface SimilarSong {
  id: string;
  song_title: string;
  artist_name: string;
  genre: string | null;
  bpm: number | null;
  key: string | null;
  is_one_stop: boolean | null;
}

export default function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [song, setSong] = useState<Song | null>(null);
  const [similar, setSimilar] = useState<SimilarSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [recentList, setRecentList] = useState<{ slug: string; name: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const gate = useVisitorUnlock();

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("frvr.shortlist") : null;
    if (raw) {
      try {
        setRecentList(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const addToRecent = async () => {
    if (!recentList) return;
    setAdding(true);
    try {
      const r = await fetch(`/api/catalog/shortlist/${recentList.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: id, action: "add" }),
      });
      if (!r.ok) throw new Error();
      setAdded(true);
      toast.success(`Added to ${recentList.name}`);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      toast.error("Could not add — try creating a new shortlist");
    } finally {
      setAdding(false);
    }
  };

  const createAndAdd = async (name: string) => {
    setAdding(true);
    try {
      const r = await fetch(`/api/catalog/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!r.ok) throw new Error();
      const { shortlist } = await r.json();
      await fetch(`/api/catalog/shortlist/${shortlist.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: id, action: "add" }),
      });
      localStorage.setItem(
        "frvr.shortlist",
        JSON.stringify({ slug: shortlist.slug, name: shortlist.name }),
      );
      router.push(`/catalog/shortlist/${shortlist.slug}`);
    } catch {
      toast.error("Could not create shortlist");
      setAdding(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/catalog/songs/${id}`);
        if (!r.ok) throw new Error("not found");
        const data = await r.json();
        setSong(data.song);
        setSimilar(data.similar ?? []);
      } catch {
        // handled below by !song
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!song?.signed_audio_url) return;
    const audio = new Audio(song.signed_audio_url);
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => setPlaying(false));
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [song?.signed_audio_url]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!gate.unlocked) {
      gate.promptUnlock();
      return;
    }
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const seek = (pct: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = duration * pct;
    setCurrentTime(audio.currentTime);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 breath">
          Opening the track
        </p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-display text-5xl font-black">Song not found</h1>
        <Link
          href="/catalog"
          className="text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-white"
        >
          ← Back to the catalog
        </Link>
      </div>
    );
  }

  const accent = song.rooms?.[0]?.accent_color ?? "#DC2626";
  const fmt = (s: number) => {
    if (!isFinite(s)) return "—:—";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };
  const progressPct = duration ? currentTime / duration : 0;

  return (
    <div className="min-h-screen relative">
      {/* Ambient backdrop */}
      <div aria-hidden className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 70% at 30% 20%, ${accent}35 0%, transparent 70%),
              radial-gradient(ellipse 70% 80% at 80% 80%, ${accent}22 0%, transparent 70%),
              linear-gradient(180deg, #050505 0%, #000000 100%)
            `,
          }}
        />
        <div aria-hidden className="absolute inset-0 drift">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${accent}18 0%, transparent 60%)`,
              filter: "blur(60px)",
            }}
          />
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 pt-28 pb-40">
        <Link
          href={
            song.rooms?.[0]
              ? `/catalog/rooms/${song.rooms[0].slug}`
              : "/catalog"
          }
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-white/50 hover:text-white transition-colors mb-16"
        >
          <ArrowLeft className="size-3" />
          {song.rooms?.[0] ? song.rooms[0].name : "Catalog"}
        </Link>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-[10px] uppercase tracking-[0.5em] mb-6"
          style={{ color: accent }}
        >
          {song.genre ?? "Track"}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(3rem,9vw,7rem)] font-black leading-[0.9] tracking-[-0.03em] chromatic text-white"
        >
          {song.song_title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-4 text-lg md:text-2xl font-display italic text-white/75"
        >
          {song.artist_name}
        </motion.p>

        {/* Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-14 p-6 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl"
        >
          <div className="flex items-center gap-5">
            <button
              onClick={toggle}
              disabled={!song.signed_audio_url}
              className="shrink-0 size-16 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: accent, boxShadow: `0 8px 30px -4px ${accent}88` }}
              aria-label={playing ? "Pause" : gate.unlocked ? "Play" : "Unlock playback"}
            >
              {playing ? (
                <Pause className="size-5 text-white" fill="white" />
              ) : !gate.unlocked && song.signed_audio_url ? (
                <Lock className="size-5 text-white" />
              ) : (
                <Play className="size-5 text-white translate-x-0.5" fill="white" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2 tabular-nums">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration || song.analysis?.duration_sec || 0)}</span>
              </div>
              {song.analysis?.waveform_peaks && song.analysis.waveform_peaks.length > 0 ? (
                <Waveform
                  peaks={song.analysis.waveform_peaks}
                  progress={progressPct}
                  accent={accent}
                  onSeek={seek}
                  height={56}
                />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    seek(Math.max(0, Math.min(1, pct)));
                  }}
                  className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden cursor-pointer"
                  aria-label="Scrub"
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-100"
                    style={{
                      width: `${progressPct * 100}%`,
                      background: accent,
                      boxShadow: `0 0 10px ${accent}`,
                    }}
                  />
                </button>
              )}
            </div>
          </div>

          {!song.signed_audio_url && (
            <p className="mt-4 text-[11px] text-white/40 italic">
              No preview available — contact FRVR Sounds for full stream access.
            </p>
          )}
        </motion.div>

        {/* Add to shortlist */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.85 }}
          className="mt-6 flex flex-wrap gap-3"
        >
          {recentList ? (
            <button
              onClick={addToRecent}
              disabled={adding || added}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 bg-black/40 text-xs uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {added ? (
                <>
                  <Check className="size-3.5" style={{ color: accent }} />
                  Added to {recentList.name}
                </>
              ) : (
                <>
                  <BookmarkPlus className="size-3.5" />
                  Add to {recentList.name}
                </>
              )}
            </button>
          ) : null}
          <button
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 bg-black/40 text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <BookmarkPlus className="size-3.5" />
            {recentList ? "New shortlist" : "Add to shortlist"}
          </button>
        </motion.div>

        {openCreate && (
          <CreateShortlistForm
            onCancel={() => setOpenCreate(false)}
            onCreate={createAndAdd}
            busy={adding}
          />
        )}

        {/* Metadata grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <MetaTile
            label="BPM"
            value={
              song.bpm
                ? String(song.bpm)
                : song.analysis?.detected_bpm
                  ? String(Math.round(song.analysis.detected_bpm))
                  : "—"
            }
            hint={
              !song.bpm && song.analysis?.detected_bpm ? "detected" : undefined
            }
          />
          <MetaTile
            label="Key"
            value={song.key ?? song.analysis?.detected_key ?? "—"}
            hint={
              !song.key && song.analysis?.detected_key ? "detected" : undefined
            }
          />
          <MetaTile label="Vocal" value={song.vocal_type ?? "—"} />
          <MetaTile
            label="License"
            value={song.is_one_stop ? "One-Stop" : "Split"}
            accent={song.is_one_stop ? accent : undefined}
          />
        </motion.div>

        {song.analysis?.lufs_integrated !== null && song.analysis?.lufs_integrated !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.95 }}
            className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <MetaTile
              label="LUFS"
              value={song.analysis.lufs_integrated.toFixed(1)}
            />
            {song.analysis.true_peak_db !== null && (
              <MetaTile
                label="True Peak"
                value={`${song.analysis.true_peak_db.toFixed(1)} dB`}
              />
            )}
            {song.analysis.dynamic_range !== null && (
              <MetaTile
                label="LRA"
                value={`${song.analysis.dynamic_range.toFixed(1)} LU`}
              />
            )}
          </motion.div>
        )}

        {song.moods && song.moods.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.0 }}
            className="mt-8"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-3">
              Moods
            </p>
            <div className="flex flex-wrap gap-2">
              {song.moods.map((m) => (
                <span
                  key={m}
                  className="text-[10px] uppercase tracking-[0.25em] text-white/70 px-3 py-1.5 border border-white/10 rounded-full"
                >
                  {m}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {song.rooms && song.rooms.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="mt-10"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-3">
              Lives in these rooms
            </p>
            <div className="flex flex-wrap gap-2">
              {song.rooms.map((r) => (
                <Link
                  key={r.slug}
                  href={`/catalog/rooms/${r.slug}`}
                  className="text-[11px] uppercase tracking-[0.3em] px-3 py-2 rounded-full border transition-all hover:scale-105"
                  style={{
                    borderColor: `${r.accent_color ?? "#DC2626"}66`,
                    color: "#fff",
                    background: `${r.accent_color ?? "#DC2626"}15`,
                  }}
                >
                  {r.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {similar.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-16 pt-10 border-t border-white/5"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-5">
              In the same rooms
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {similar.map((s) => (
                <Link
                  key={s.id}
                  href={`/catalog/song/${s.id}`}
                  className="group border-b border-white/5 py-4 hover:bg-white/[0.02] transition-colors flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display text-base md:text-lg font-medium text-white truncate">
                      {s.song_title}
                    </h4>
                    <p className="text-xs text-white/50 mt-0.5 truncate">
                      {s.artist_name}
                      {s.genre && (
                        <>
                          <span className="mx-2 text-white/20">·</span>
                          <span>{s.genre}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/40 shrink-0">
                    {s.bpm && <span className="tabular-nums">{s.bpm}</span>}
                    {s.key && (
                      <>
                        <span className="opacity-40">·</span>
                        <span>{s.key}</span>
                      </>
                    )}
                    {s.is_one_stop && (
                      <>
                        <span className="opacity-40">·</span>
                        <span style={{ color: accent }}>1-Stop</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.3 }}
          className="mt-16 pt-10 border-t border-white/5 text-[10px] uppercase tracking-[0.4em] text-white/40"
        >
          <p>
            Interested in licensing this track? <Link href="/submit" className="text-white/70 hover:text-white underline decoration-white/20">Contact FRVR Sounds</Link>
          </p>
        </motion.div>
      </div>

      <VisitorGateModal open={gate.open} onClose={gate.dismiss} onSubmit={gate.submit} />
    </div>
  );
}

function MetaTile({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-4">
      <p className="text-[9px] uppercase tracking-[0.35em] text-white/40">
        {label}
      </p>
      <p
        className="mt-1 text-base md:text-lg font-display font-semibold tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-[9px] uppercase tracking-[0.25em] text-white/30">
          {hint}
        </p>
      )}
    </div>
  );
}

function CreateShortlistForm({
  onCancel,
  onCreate,
  busy,
}: {
  onCancel: () => void;
  onCreate: (name: string) => void;
  busy: boolean;
}) {
  const [name, setName] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 p-5 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl max-w-md"
    >
      <p className="text-[10px] uppercase tracking-[0.4em] text-white/50 mb-3">
        New shortlist
      </p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. A24 Film — Romantic Arc"
        className="w-full bg-[#111] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#DC2626]/50"
        onKeyDown={(e) => e.key === "Enter" && name.trim() && onCreate(name.trim())}
      />
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={busy}
          className="text-[10px] uppercase tracking-[0.3em] text-white/50 hover:text-white transition-colors px-3 py-2"
        >
          Cancel
        </button>
        <button
          onClick={() => name.trim() && onCreate(name.trim())}
          disabled={busy || !name.trim()}
          className="text-[10px] uppercase tracking-[0.3em] text-white px-4 py-2 rounded-full border border-[#DC2626]/40 bg-[#DC2626]/10 hover:bg-[#DC2626]/20 transition-colors disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create + add"}
        </button>
      </div>
    </motion.div>
  );
}
