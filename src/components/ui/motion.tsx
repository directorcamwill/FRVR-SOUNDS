"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
