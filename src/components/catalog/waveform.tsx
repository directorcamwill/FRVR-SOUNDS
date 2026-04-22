"use client";

import { useMemo } from "react";

interface WaveformProps {
  peaks: number[] | null | undefined;
  progress?: number;
  accent?: string;
  onSeek?: (pct: number) => void;
  height?: number;
  className?: string;
}

export function Waveform({
  peaks,
  progress = 0,
  accent = "#DC2626",
  onSeek,
  height = 64,
  className,
}: WaveformProps) {
  const safePeaks = useMemo(() => {
    if (!peaks || peaks.length === 0) return null;
    const max = Math.max(...peaks, 0.001);
    return peaks.map((p) => Math.max(0.02, p / max));
  }, [peaks]);

  if (!safePeaks) {
    return (
      <div
        className={className}
        style={{ height }}
        aria-hidden
      >
        <div className="h-full w-full rounded-md bg-white/5 animate-pulse" />
      </div>
    );
  }

  const svg = (
    <svg
      viewBox={`0 0 ${safePeaks.length} 100`}
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      {safePeaks.map((p, i) => {
        const x = i + 0.5;
        const h = p * 90;
        const y1 = 50 - h / 2;
        const y2 = 50 + h / 2;
        const played = i / safePeaks.length < progress;
        return (
          <line
            key={i}
            x1={x}
            x2={x}
            y1={y1}
            y2={y2}
            stroke={played ? accent : "rgba(255,255,255,0.28)"}
            strokeWidth={0.8}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );

  if (onSeek) {
    return (
      <button
        type="button"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          onSeek(Math.max(0, Math.min(1, pct)));
        }}
        className={className}
        style={{ height, width: "100%", display: "block", cursor: "pointer" }}
        aria-label="Scrub track"
      >
        {svg}
      </button>
    );
  }

  return (
    <div
      className={className}
      style={{ height, width: "100%", display: "block" }}
      aria-hidden
    >
      {svg}
    </div>
  );
}
