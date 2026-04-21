"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  shortlist_note: string | null;
}

interface Shortlist {
  id: string;
  slug: string;
  name: string;
  supervisor_name: string | null;
  supervisor_email: string | null;
  supervisor_company: string | null;
  notes: string | null;
  view_count: number;
  created_at: string;
}

export default function ShortlistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [list, setList] = useState<Shortlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");

  const refresh = async () => {
    try {
      const r = await fetch(`/api/catalog/shortlist/${slug}`);
      if (!r.ok) throw new Error("not found");
      const data = await r.json();
      setList(data.shortlist);
      setSongs(data.songs ?? []);
      setName(data.shortlist?.name ?? "");
    } catch {
      // handled below
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [slug]);

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

  const remove = async (dealId: string) => {
    try {
      await fetch(`/api/catalog/shortlist/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId, action: "remove" }),
      });
      setSongs((s) => s.filter((x) => x.id !== dealId));
      toast.success("Removed from shortlist");
    } catch {
      toast.error("Could not remove");
    }
  };

  const saveName = async () => {
    if (!name.trim() || name === list?.name) {
      setEditingName(false);
      return;
    }
    try {
      await fetch(`/api/catalog/shortlist/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setList((l) => (l ? { ...l, name } : l));
      setEditingName(false);
      toast.success("Renamed");
    } catch {
      toast.error("Could not rename");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied — share with your team");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 breath">
          Loading shortlist
        </p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-display text-5xl font-black">Shortlist not found</h1>
        <Link
          href="/catalog"
          className="text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-white"
        >
          ← Back to the catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div aria-hidden className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 70% at 30% 20%, rgba(220, 38, 38, 0.18) 0%, transparent 70%),
              linear-gradient(180deg, #050505 0%, #000000 100%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 pt-28 pb-32">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-white/50 hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="size-3" />
          Catalog
        </Link>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-[10px] uppercase tracking-[0.5em] text-[#DC2626] mb-4"
        >
          Shortlist · {songs.length} {songs.length === 1 ? "track" : "tracks"}
        </motion.p>

        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            className="font-display text-[clamp(2.5rem,7vw,5.5rem)] font-black leading-[0.9] tracking-[-0.03em] bg-transparent border-b border-white/20 text-white focus:outline-none focus:border-[#DC2626] w-full"
          />
        ) : (
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            onClick={() => setEditingName(true)}
            className="font-display text-[clamp(2.5rem,7vw,5.5rem)] font-black leading-[0.9] tracking-[-0.03em] chromatic text-white cursor-text"
          >
            {list.name}
          </motion.h1>
        )}

        {(list.supervisor_name || list.supervisor_company) && (
          <p className="mt-4 text-sm text-white/60 italic">
            Built by {list.supervisor_name}
            {list.supervisor_company && ` · ${list.supervisor_company}`}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#DC2626]/40 bg-[#DC2626]/10 text-xs uppercase tracking-[0.3em] text-white hover:bg-[#DC2626]/20 transition-colors"
          >
            <Copy className="size-3.5" />
            Copy share link
          </button>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
            {list.view_count} {list.view_count === 1 ? "view" : "views"}
          </span>
        </div>

        {songs.length === 0 ? (
          <div className="mt-20 text-center py-24 border border-white/5 rounded-2xl bg-white/[0.02]">
            <p className="font-display text-3xl italic font-light text-white/50 mb-4">
              Empty shortlist.
            </p>
            <p className="text-sm text-white/40 max-w-md mx-auto">
              Browse{" "}
              <Link
                href="/catalog"
                className="underline text-white/70 hover:text-white"
              >
                the rooms
              </Link>{" "}
              and use{" "}
              <span className="text-white/70">Add to shortlist</span> on any
              track you love.
            </p>
          </div>
        ) : (
          <div className="mt-14 border-t border-white/5">
            {songs.map((song, i) => (
              <ShortlistRow
                key={song.id}
                song={song}
                index={i}
                isPlaying={playingId === song.id}
                onPlay={() => play(song)}
                onRemove={() => remove(song.id)}
              />
            ))}
          </div>
        )}
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

function ShortlistRow({
  song,
  index,
  isPlaying,
  onPlay,
  onRemove,
}: {
  song: Song;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.04, 0.4),
      }}
      className="group border-b border-white/5 py-5 hover:bg-white/[0.02] transition-colors"
    >
      <div className="flex items-center gap-4 md:gap-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 w-8 tabular-nums shrink-0">
          {String(index + 1).padStart(2, "0")}
        </div>

        <button
          type="button"
          onClick={onPlay}
          className="shrink-0 size-11 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 transition-all"
          style={
            isPlaying ? { background: "#DC2626", borderColor: "#DC2626" } : undefined
          }
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-4 text-white" fill="white" />
          ) : (
            <Play className="size-4 text-white/80 translate-x-px" fill="currentColor" />
          )}
        </button>

        <Link
          href={`/catalog/song/${song.id}`}
          className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
        >
          <h3 className="font-display text-lg md:text-2xl font-medium text-white truncate">
            {song.song_title}
          </h3>
          <p className="text-xs md:text-sm text-white/50 mt-0.5">
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
              <span style={{ color: "#DC2626" }}>One-Stop</span>
            </>
          )}
        </div>

        <button
          onClick={onRemove}
          className="shrink-0 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Remove from shortlist"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {song.shortlist_note && (
        <p className="mt-2 ml-[72px] text-xs italic text-white/50 max-w-2xl">
          &ldquo;{song.shortlist_note}&rdquo;
        </p>
      )}
    </motion.div>
  );
}
