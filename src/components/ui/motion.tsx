"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// Ambient background — drifting cyan + white orbs layered under content.
// Complements the existing static red glow in the dashboard shell; we keep
// that in place and add complementary depth here (EVOLUTION_PLAN §5.4).
// Honors prefers-reduced-motion: renders static orbs instead of animating.
export function AmbientOrbs({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  const orbs = [
    {
      key: "cyan",
      size: 400,
      background: "#22d3ee",
      opacity: 0.035,
      position: { bottom: -160, left: -80 } as const,
      delay: -10,
    },
    {
      key: "white",
      size: 300,
      background: "#ffffff",
      opacity: 0.012,
      position: { top: "40%", left: "40%" } as const,
      delay: -18,
    },
    {
      key: "red-drift",
      size: 360,
      background: "#dc2626",
      opacity: 0.045,
      position: { top: -140, left: "45%" } as const,
      delay: -4,
    },
  ];

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 pointer-events-none overflow-hidden z-0",
        className
      )}
    >
      {orbs.map((orb) => {
        const style = {
          width: orb.size,
          height: orb.size,
          background: orb.background,
          opacity: orb.opacity,
          filter: "blur(140px)",
          ...orb.position,
        };
        if (reduce) {
          return (
            <div
              key={orb.key}
              className="absolute rounded-full"
              style={style}
            />
          );
        }
        return (
          <motion.div
            key={orb.key}
            className="absolute rounded-full"
            style={style}
            animate={{
              x: [0, 40, -30, 0],
              y: [0, -30, 40, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: orb.delay,
            }}
          />
        );
      })}
    </div>
  );
}

// Thin cinematic scanline sweeping vertically across the viewport.
// Very low opacity so it reads as ambient signal, not chrome.
// Omitted entirely under prefers-reduced-motion.
export function Scanline() {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 pointer-events-none z-0"
      style={{
        height: 2,
        background:
          "linear-gradient(90deg, transparent, #dc2626, #22d3ee, transparent)",
        opacity: 0.14,
      }}
      initial={{ top: -2 }}
      animate={{ top: "100vh" }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

// Animated card that fades in and lifts on hover
export function MotionCard({ children, className, delay = 0, ...props }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  [key: string]: unknown;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn("glass-card rounded-xl p-4", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Animated number counter
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      {value}
    </motion.span>
  );
}

// Staggered list container
export function StaggerContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered list item
export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Pulsing glow indicator
export function GlowDot({ color = "red", size = "sm" }: { color?: "red" | "green" | "amber"; size?: "sm" | "md" }) {
  const colors = {
    red: "bg-red-500 shadow-red-500/50",
    green: "bg-emerald-500 shadow-emerald-500/50",
    amber: "bg-amber-500 shadow-amber-500/50",
  };
  const sizes = {
    sm: "size-2",
    md: "size-3",
  };
  return (
    <motion.div
      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={cn("rounded-full shadow-lg", colors[color], sizes[size])}
    />
  );
}

// Confidence pill — surfaces AI self-assessed certainty (0-1).
// Thresholds per UPGRADE_SPEC: >=0.85 emerald, 0.70-0.84 chrome, <0.70 red.
// Renders null when score is null/undefined/out-of-range so we never lie about signal.
export function ConfidencePill({
  score,
  className,
  showLabel = true,
}: {
  score: number | null | undefined;
  className?: string;
  showLabel?: boolean;
}) {
  if (score == null || !Number.isFinite(score) || score < 0 || score > 1) {
    return null;
  }

  const pct = Math.round(score * 100);
  const tier =
    score >= 0.85 ? "high" : score >= 0.7 ? "mid" : "low";

  const styles = {
    high: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    mid: "border-[#c0c8d8]/30 bg-[#c0c8d8]/10 text-[#c0c8d8]",
    low: "border-red-500/40 bg-red-500/10 text-red-300",
  } as const;

  const label = {
    high: "High confidence",
    mid: "Moderate confidence",
    low: "Low — review",
  } as const;

  return (
    <span
      role="status"
      aria-label={`AI confidence ${pct}% — ${label[tier]}`}
      title={label[tier]}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
        "text-[10px] font-medium uppercase tracking-[0.15em] tabular-nums",
        "motion-safe:transition-colors motion-safe:duration-300",
        styles[tier],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      <span>{pct}%</span>
      {showLabel && <span className="opacity-70">conf</span>}
    </span>
  );
}

// Glowing border card for important items
export function GlowCard({ children, className, intensity = "medium" }: {
  children: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
}) {
  const shadows = {
    low: "hover:shadow-[0_0_15px_rgba(220,38,38,0.15)]",
    medium: "hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]",
    high: "shadow-[0_0_20px_rgba(220,38,38,0.15)] hover:shadow-[0_0_40px_rgba(220,38,38,0.3)]",
  };
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        "glass-card rounded-xl border border-[#1A1A1A] transition-all duration-300",
        shadows[intensity],
        className
      )}
    >
      {children}
    </motion.div>
  );
}
