"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { RoomScene } from "@/components/catalog/room-scene";

interface Room {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  hero_image_url: string | null;
  hero_video_url: string | null;
  accent_color: string | null;
  song_count: number;
  sort_order: number;
}

export default function CatalogLobby() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0); // 0 = hero, 1..N = rooms
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/catalog/rooms");
        const data = await r.json();
        setRooms(data.rooms ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Track which slide is in view via IntersectionObserver
  useEffect(() => {
    if (!scrollerRef.current || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.index ?? "0",
            );
            setActiveIndex(idx);
          }
        }
      },
      {
        root: scrollerRef.current,
        threshold: [0.6, 0.8, 1],
      },
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [loading, rooms.length]);

  const scrollToIndex = useCallback((idx: number) => {
    const el = slideRefs.current[idx];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Keyboard navigation — ↑↓ / pgUp pgDn / home end
  useEffect(() => {
    const total = rooms.length + 1; // +1 for hero
    const handler = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        scrollToIndex(Math.min(activeIndex + 1, total - 1));
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        scrollToIndex(Math.max(activeIndex - 1, 0));
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToIndex(total - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, rooms.length, scrollToIndex]);

  const total = rooms.length + 1;

  return (
    <div
      ref={scrollerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* Side dot indicator — shows which slide you're on */}
      <SlideIndicator
        total={total}
        active={activeIndex}
        rooms={rooms}
        onJump={scrollToIndex}
      />

      {/* Hero slide — first snap */}
      <HeroSlide
        ref={(el: HTMLElement | null) => {
          slideRefs.current[0] = el;
        }}
        onEnter={() => scrollToIndex(1)}
        hasRooms={rooms.length > 0}
      />

      {loading ? (
        <LoadingSlide />
      ) : (
        rooms.map((room, i) => (
          <RoomSlide
            key={room.id}
            ref={(el: HTMLElement | null) => {
              slideRefs.current[i + 1] = el;
            }}
            room={room}
            index={i}
            total={rooms.length}
            isActive={activeIndex === i + 1}
            nextRoomName={rooms[i + 1]?.name ?? null}
            onNext={() => scrollToIndex(i + 2)}
          />
        ))
      )}
    </div>
  );
}

/* ============================================================ */

const HeroSlide = forwardRef<
  HTMLElement,
  { onEnter: () => void; hasRooms: boolean }
>(function HeroSlide({ onEnter, hasRooms }, ref) {
  return (
      <section
        ref={ref}
        data-index="0"
        className="relative h-screen snap-start flex items-start justify-center overflow-hidden pt-32 md:pt-40"
      >
        {/* Full-bleed cinematic establishing shot — the Northwoods estate */}
        <div aria-hidden className="absolute inset-0">
          <motion.img
            src="/catalog/rooms/catalog-hero.webp"
            alt=""
            initial={{ scale: 1.08 }}
            animate={{ scale: 1.0 }}
            transition={{ duration: 20, ease: "linear" }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Subtle top + bottom fade only — lets the image breathe */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 20%, transparent 50%, rgba(0,0,0,0.85) 100%)
              `,
            }}
          />
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl">
          {/* Opening credit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.2 }}
            className="mb-5 flex items-center justify-center gap-4"
          >
            <span className="h-px w-8 bg-white/40" />
            <p className="text-[9px] md:text-[10px] uppercase tracking-[0.7em] text-white/85 breath"
               style={{ textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>
              FRVR Sounds Presents
            </p>
            <span className="h-px w-8 bg-white/40" />
          </motion.div>

          {/* Main title card — stacked for dramatic film-title treatment */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-display leading-[0.85] font-black chromatic"
            style={{ textShadow: "0 4px 40px rgba(0,0,0,0.95), 0 2px 14px rgba(0,0,0,0.85)" }}
          >
            <span className="italic font-normal block text-[clamp(1.5rem,3.5vw,3rem)] text-[#DC2626] tracking-[0.04em] mb-2">
              The
            </span>
            <motion.span
              initial={{ letterSpacing: "0.15em" }}
              animate={{ letterSpacing: "0.02em" }}
              transition={{ duration: 2.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="block text-[clamp(4rem,12vw,13rem)] uppercase tracking-tight"
            >
              Catalog
            </motion.span>
          </motion.h1>

          {/* Subtitle in film-credit italic */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 1.2 }}
            className="mt-5 max-w-xl mx-auto text-base md:text-lg text-white/80 leading-snug font-display font-normal italic tracking-wide"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}
          >
            Ten rooms. One world. Stories from the edge of the map.
          </motion.p>

          {/* Chapter credit */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 1.8 }}
            className="mt-3 text-[9px] uppercase tracking-[0.5em] text-white/55"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
          >
            — A Sync Licensing Experience —
          </motion.p>

        </div>

        {/* CTA pinned to bottom */}
        {hasRooms && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.6 }}
            onClick={onEnter}
            className="absolute bottom-10 md:bottom-14 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-white/70 hover:text-white transition-colors group"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}
          >
            <span>Begin the Tour</span>
            <motion.span
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowDown className="size-3" />
            </motion.span>
          </motion.button>
        )}

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </section>
    );
});

/* ============================================================ */

const RoomSlide = forwardRef<
  HTMLElement,
  {
    room: Room;
    index: number;
    total: number;
    isActive: boolean;
    nextRoomName: string | null;
    onNext: () => void;
  }
>(function RoomSlide(
  { room, index, total, isActive, nextRoomName, onNext },
  ref,
) {
  const accent = room.accent_color ?? "#DC2626";
    const displayIndex = String(index + 1).padStart(2, "0");
    const displayTotal = String(total).padStart(2, "0");

    return (
      <section
        ref={ref}
        data-index={index + 1}
        className="relative h-screen snap-start overflow-hidden"
      >
        {/* Full-bleed backdrop — real photography if we have it, animated scene as fallback */}
        <div className="absolute inset-0">
          {room.hero_video_url ? (
            <motion.div
              key={`hero-${room.slug}`}
              initial={{ scale: 1.08 }}
              animate={{ scale: isActive ? 1.02 : 1.08 }}
              transition={{ duration: 8, ease: "linear" }}
              className="absolute inset-0"
            >
              <video
                src={room.hero_video_url}
                poster={room.hero_image_url ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                preload={index < 3 ? "auto" : "metadata"}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </motion.div>
          ) : room.hero_image_url ? (
            <motion.div
              key={`hero-${room.slug}`}
              initial={{ scale: 1.08 }}
              animate={{ scale: isActive ? 1.02 : 1.08 }}
              transition={{ duration: 8, ease: "linear" }}
              className="absolute inset-0"
            >
              <img
                src={room.hero_image_url}
                alt={room.name}
                className="absolute inset-0 w-full h-full object-cover"
                loading={index < 3 ? "eager" : "lazy"}
              />
            </motion.div>
          ) : (
            <RoomScene slug={room.slug} accent={accent} />
          )}
        </div>

        {/* Film grain on top of scene */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none z-10"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
            animation: "grain-shift 1.3s steps(6) infinite",
          }}
        />

        {/* Subtle top + bottom fade — lets picture breathe, darkens under text */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `
              linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 20%, transparent 45%, rgba(0,0,0,0.85) 100%)
            `,
          }}
        />

        {/* Top overlay row — room counter + next room peek */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between px-6 md:px-10 pt-24 md:pt-28">
          <AnimatePresence mode="wait">
            {isActive && (
              <motion.p
                key={`counter-${room.slug}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="text-[10px] uppercase tracking-[0.5em]"
                style={{ color: accent }}
              >
                Room · {displayIndex} <span className="text-white/30">/ {displayTotal}</span>
              </motion.p>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {isActive && (
              <motion.div
                key={`tracks-${room.slug}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="text-right"
              >
                <p className="text-[9px] uppercase tracking-[0.4em] text-white/40">
                  {room.song_count} {room.song_count === 1 ? "Track" : "Tracks"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom-anchored content — leaves the picture visible above */}
        <div className="relative z-20 h-full flex flex-col items-center justify-end px-6 pb-24 md:pb-28 text-center">
          <AnimatePresence mode="wait">
            {isActive && (
              <motion.div
                key={room.slug}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-4xl"
              >
                {room.name.startsWith("The ") ? (
                  <h2 className="font-display font-black leading-[0.9] tracking-[-0.03em] chromatic"
                      style={{ textShadow: "0 4px 30px rgba(0,0,0,0.9), 0 2px 12px rgba(0,0,0,0.7)" }}>
                    <span className="italic font-normal text-[#DC2626] text-[clamp(1.2rem,3vw,2.5rem)] tracking-[0.02em] mr-3">
                      The
                    </span>
                    <span className="text-[clamp(3rem,8vw,7rem)] text-white">
                      {room.name.replace(/^The\s+/i, "")}
                    </span>
                  </h2>
                ) : (
                  <h2 className="font-display font-black text-[clamp(3rem,8vw,7rem)] leading-[0.9] tracking-[-0.03em] chromatic text-white"
                      style={{ textShadow: "0 4px 30px rgba(0,0,0,0.9), 0 2px 12px rgba(0,0,0,0.7)" }}>
                    {room.name}
                  </h2>
                )}

                {room.tagline && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="mt-5 max-w-2xl mx-auto text-sm md:text-base font-display font-normal italic text-white/85 leading-snug tracking-wide"
                    style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}
                  >
                    {room.tagline}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.7 }}
                  className="mt-7"
                >
                  <Link
                    href={`/catalog/rooms/${room.slug}`}
                    className="group inline-flex items-center gap-3 px-8 md:px-10 py-4 md:py-5 rounded-full border text-xs uppercase tracking-[0.4em] transition-all duration-500 hover:scale-105"
                    style={{
                      borderColor: `${accent}aa`,
                      color: "#fff",
                      background: `${accent}22`,
                      boxShadow: `0 0 0 1px ${accent}00, 0 20px 60px -20px ${accent}88`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${accent}44`;
                      e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}, 0 30px 80px -20px ${accent}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${accent}22`;
                      e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}00, 0 20px 60px -20px ${accent}88`;
                    }}
                  >
                    <span>
                      Enter {room.name}
                    </span>
                    <ArrowRight className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom peek — next room indicator */}
        {nextRoomName && (
          <button
            onClick={onNext}
            className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 z-30 text-center group"
          >
            <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 mb-2 group-hover:text-white/60 transition-colors">
              Next
            </p>
            <p className="text-xs md:text-sm font-display italic text-white/60 group-hover:text-white transition-colors tracking-wide">
              {nextRoomName}
            </p>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-3 flex justify-center"
            >
              <ArrowDown className="size-3 text-white/40 group-hover:text-white/80 transition-colors" />
            </motion.div>
          </button>
        )}
      </section>
    );
});

/* ============================================================ */

function SlideIndicator({
  total,
  active,
  rooms,
  onJump,
}: {
  total: number;
  active: number;
  rooms: Room[];
  onJump: (idx: number) => void;
}) {
  return (
    <div className="fixed right-6 md:right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-3">
      {Array.from({ length: total }).map((_, i) => {
        const room = i === 0 ? null : rooms[i - 1];
        const accent = room?.accent_color ?? "#DC2626";
        const isActive = i === active;
        return (
          <button
            key={i}
            onClick={() => onJump(i)}
            className="group flex items-center gap-3 cursor-pointer"
            aria-label={i === 0 ? "Lobby" : room?.name ?? `Slide ${i}`}
          >
            <span
              className="text-[9px] uppercase tracking-[0.35em] transition-all duration-500"
              style={{
                color: isActive ? accent : "transparent",
                transform: isActive ? "translateX(0)" : "translateX(10px)",
              }}
            >
              {i === 0 ? "Lobby" : room?.name}
            </span>
            <span
              className="block rounded-full transition-all duration-500"
              style={{
                width: isActive ? "24px" : "4px",
                height: "2px",
                background: isActive ? accent : "rgba(255,255,255,0.3)",
                boxShadow: isActive ? `0 0 10px ${accent}` : "none",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

function LoadingSlide() {
  return (
    <section className="h-screen snap-start flex items-center justify-center">
      <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 breath">
        Preparing the rooms
      </p>
    </section>
  );
}
