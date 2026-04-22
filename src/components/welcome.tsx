"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Music, Disc3, ArrowRight } from "lucide-react";

type Role = "artist" | "supervisor";
const STORAGE_KEY = "frvr.user.role";

function roleTarget(role: Role): string {
  return role === "artist" ? "/signup" : "/catalog";
}

export function Welcome() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Role | null;
      if (saved === "artist" || saved === "supervisor") {
        router.replace(roleTarget(saved));
        return;
      }
    } catch {}
    setHydrated(true);
  }, [router]);

  const pick = (role: Role) => {
    try { localStorage.setItem(STORAGE_KEY, role); } catch {}
    router.push(roleTarget(role));
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 breath">
          FRVR SOUNDS
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center px-6">
      <div aria-hidden className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 70% at 20% 15%, rgba(220, 38, 38, 0.18) 0%, transparent 65%),
              radial-gradient(ellipse 70% 80% at 85% 85%, rgba(220, 38, 38, 0.10) 0%, transparent 70%),
              linear-gradient(180deg, #060606 0%, #000000 100%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-[10px] uppercase tracking-[0.5em]"
          style={{ color: "#DC2626" }}
        >
          FRVR SOUNDS
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 font-display text-[clamp(3rem,9vw,6rem)] font-black leading-[0.9] tracking-[-0.03em] text-white"
        >
          Two ways in.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.45 }}
          className="mt-5 text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed"
        >
          Pick the path that fits. You can switch later — we'll remember.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.65 }}
          className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto"
        >
          <Choice
            icon={<Music className="size-5" />}
            tag="For artists"
            title="I make music"
            body="Your command center — AI agents, sync readiness, brand, vault, and a direct line into the FRVR Sounds library."
            cta="Start as an artist"
            onPick={() => pick("artist")}
          />
          <Choice
            icon={<Disc3 className="size-5" />}
            tag="For supervisors"
            title="I license music"
            body="Walk the Northwoods — ten rooms, curated cuts. Shortlist anything, one-stop clearances, contact us to license."
            cta="Enter the Catalog"
            onPick={() => pick("supervisor")}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.0 }}
          className="mt-10 text-[11px] uppercase tracking-[0.3em] text-white/40"
        >
          Already have an account?{" "}
          <Link href="/login" className="text-white/80 hover:text-white underline decoration-white/20">
            Sign in
          </Link>
        </motion.p>
      </div>
    </main>
  );
}

function Choice({
  icon,
  tag,
  title,
  body,
  cta,
  onPick,
}: {
  icon: React.ReactNode;
  tag: string;
  title: string;
  body: string;
  cta: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="group text-left p-6 md:p-7 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] hover:border-[#DC2626]/40 transition-all"
    >
      <div className="flex items-center gap-2">
        <span className="size-9 rounded-lg border border-white/10 bg-black/40 flex items-center justify-center text-white/70 group-hover:text-[#DC2626] transition-colors">
          {icon}
        </span>
        <span className="text-[10px] uppercase tracking-[0.35em] text-white/40">
          {tag}
        </span>
      </div>
      <h3 className="mt-5 font-display text-2xl md:text-3xl font-semibold text-white">
        {title}
      </h3>
      <p className="mt-3 text-sm text-white/60 leading-relaxed">
        {body}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] text-white group-hover:text-[#DC2626] transition-colors">
        {cta}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
      </span>
    </button>
  );
}
