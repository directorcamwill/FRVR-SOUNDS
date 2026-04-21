"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, ExternalLink, Pause, Play } from "lucide-react";

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
}

interface Room {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  hero_image_url: string | null;
  accent_color: string | null;
  sort_order: number;
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [room, setRoom] = useState<Room | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/catalog/rooms/${slug}`);
        if (!r.ok) throw new Error("not found");
        const data = await r.json();
        setRoom(data.room);
        setSongs(data.songs ?? []);
      } catch {
        // handle 404
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const play = (song: Song) => {
    if (!song.signed_audio_url) return;
    if (playingId === song.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(song.signed_audio_url);
    audioRef.current.play();
    audioRef.current.addEventListener("ended", () => setPlayingId(null));
    setPlayingId(song.id);
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 breath">
          Opening the door
        </p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-display text-6xl font-black">Room not found</h1>
        <Link
          href="/catalog"
          className="text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-white"
        >
          ← Back to lobby
        </Link>
      </div>
    );
  }

  const accent = room.accent_color ?? "#DC2626";

  return (
    <>
      {/* HERO */}
      <section
        ref={heroRef}
        className="relative h-screen min-h-[700px] overflow-hidden flex items-center"
      >
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0"
        >
          {room.hero_image_url ? (
            <>
              <img
                src={room.hero_image_url}
                alt={room.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Warm color wash + darken for legibility */}
              <div
                className="absolute inset-0 mix-blend-multiply"
                style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.55))` }}
              />
              <div
                className="absolute inset-0 mix-blend-overlay opacity-60"
                style={{
                  background: `radial-gradient(ellipse 90% 70% at 50% 30%, ${accent}55 0%, transparent 70%)`,
                }}
              />
            </>
          ) : (
            <>
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(ellipse 90% 70% at 30% 20%, ${accent}55 0%, transparent 65%),
                    radial-gradient(ellipse 70% 90% at 80% 80%, ${accent}33 0%, transparent 70%),
                    linear-gradient(180deg, #050505 0%, #000000 100%)
                  `,
                }}
              />
              <div aria-hidden className="absolute inset-0 drift">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${accent}22 0%, transparent 60%)`,
                    filter: "blur(60px)",
                  }}
                />
              </div>
            </>
          )}
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 w-full"
        >
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-white/50 hover:text-white transition-colors mb-12"
          >
            <ArrowLeft className="size-3" />
            Lobby
          </Link>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[10px] uppercase tracking-[0.5em] mb-6"
            style={{ color: accent }}
          >
            Room {String(room.sort_order / 10).padStart(2, "0")} · {songs.length}{" "}
            {songs.length === 1 ? "track" : "tracks"}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[15vw] md:text-[11vw] lg:text-[180px] leading-[0.85] font-black tracking-[-0.04em] chromatic max-w-6xl"
          >
            {room.name.startsWith("The ") ? (
              <>
                <span
                  className="italic font-normal block text-[40%] tracking-[0.02em]"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  The
                </span>
                {room.name.replace(/^The\s+/i, "")}
              </>
            ) : (
              room.name
            )}
          </motion.h1>

          {room.tagline && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="mt-10 text-lg md:text-2xl font-display font-normal italic text-white/70 max-w-2xl leading-relaxed tracking-wide"
            >
              {room.tagline}
            </motion.p>
          )}
        </motion.div>
      </section>

      {/* DESCRIPTION + TRACK LIST */}
      <section className="relative max-w-6xl mx-auto px-6 md:px-10 -mt-20 md:-mt-32 pb-32">
        {room.description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="text-base md:text-lg text-white/70 leading-relaxed font-display font-light max-w-3xl mb-24"
          >
            {room.description}
          </motion.p>
        )}

        {songs.length === 0 ? (
          <div className="text-center py-32 border border-white/5 rounded-2xl bg-white/[0.02]">
            <p className="font-display text-3xl md:text-4xl italic font-light text-white/50 mb-4">
              Curated silence.
            </p>
            <p className="text-sm text-white/40 max-w-sm mx-auto">
              This room is being assembled. Check back — or{" "}
              <Link
                href="/submit"
                className="underline hover:text-white transition-colors"
                style={{ color: accent }}
              >
                submit your song
              </Link>{" "}
              to be considered.
            </p>
          </div>
        ) : (
          <div className="space-y-0 border-t border-white/5">
            {songs.map((song, i) => (
              <TrackRow
                key={song.id}
                song={song}
                index={i}
                accent={accent}
                isPlaying={playingId === song.id}
                onPlay={() => play(song)}
              />
            ))}
          </div>
        )}

        {/* Next room */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-32 flex items-center justify-between border-t border-white/5 pt-10"
        >
          <Link
            href="/catalog"
            className="text-[11px] uppercase tracking-[0.3em] text-white/50 hover:text-white transition-colors"
          >
            ← All Rooms
          </Link>
          <Link
            href="/catalog/search"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/50 hover:text-white transition-colors"
          >
            Search Catalog
            <ArrowRight className="size-3" />
          </Link>
        </motion.div>
      </section>

      {/* Sticky now-playing indicator */}
      {playingId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 flex items-center gap-3">
          <span
            className="size-2 rounded-full live-dot"
            style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
          />
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/70">
            Now Playing
          </span>
        </div>
      )}
    </>
  );
}

function TrackRow({
  song,
  index,
  accent,
  isPlaying,
  onPlay,
}: {
  song: Song;
  index: number;
  accent: string;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{
        duration: 0.6,
        delay: Math.min(index * 0.04, 0.5),
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={onPlay}
      className="group block w-full text-left border-b border-white/5 py-6 md:py-8 hover:bg-white/[0.02] transition-colors"
    >
      <div className="flex items-center gap-5 md:gap-8">
        <div className="text-[11px] uppercase tracking-[0.3em] text-white/30 w-10 tabular-nums shrink-0">
          {String(index + 1).padStart(2, "0")}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="shrink-0 size-12 md:size-14 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 transition-all"
          style={
            isPlaying
              ? { background: accent, borderColor: accent }
              : undefined
          }
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-4 text-white" fill="white" />
          ) : (
            <Play className="size-4 text-white/80 group-hover:text-white translate-x-px" fill="currentColor" />
          )}
        </button>

        <Link
          href={`/catalog/song/${song.id}`}
          className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-display text-2xl md:text-3xl font-medium text-white truncate">
            {song.song_title}
          </h3>
          <p className="text-sm text-white/50 mt-0.5">
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
              <span style={{ color: accent }}>One-Stop</span>
            </>
          )}
          <Link
            href={`/catalog/song/${song.id}`}
            onClick={(e) => e.stopPropagation()}
            className="ml-2 text-white/40 hover:text-white transition-colors"
            aria-label="Open track detail"
          >
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </div>

      {song.moods && song.moods.length > 0 && (
        <div className="mt-3 ml-[76px] md:ml-[104px] flex flex-wrap gap-2">
          {song.moods.slice(0, 5).map((m) => (
            <span
              key={m}
              className="text-[9px] uppercase tracking-[0.2em] text-white/40 px-2 py-0.5 border border-white/10 rounded-full"
            >
              {m}
            </span>
          ))}
        </div>
      )}
    </motion.button>
  );
}
