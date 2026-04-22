"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Send,
  Loader2,
  Volume2,
  VolumeX,
  Sparkles,
  Mic,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";
import type { BrandModuleId } from "@/types/brand";

/**
 * Wiki Oracle — conversational Q&A with the Brand Wiki. Voice-rendered via
 * ElevenLabs. Sits as an overlay panel inside the globe modal.
 */

interface ChatTurn {
  id: string;
  role: "user" | "oracle";
  text: string;
  nextMove?: string | null;
  confidence?: number | null;
  audioUrl?: string | null;
  voiceError?: string | null;
}

const SUGGESTED_PROMPTS = [
  "How should I pitch myself to a music supervisor?",
  "Write me a two-line Instagram bio.",
  "What's the most distinctive fact about my brand?",
  "What kind of song should I write next?",
  "Who should I collaborate with?",
  "What's missing from my Brand Wiki?",
];

export function WikiOracle({
  focusModule,
  onClose,
  onSpeakingChange,
}: {
  focusModule: BrandModuleId | null;
  onClose?: () => void;
  onSpeakingChange?: (speaking: boolean) => void;
}) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null); // turn id
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: "user",
      text: question,
    };
    setTurns((prev) => [...prev, userTurn]);
    setDraft("");
    setLoading(true);
    try {
      const res = await fetch("/api/brand-wiki/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          focus_module: focusModule,
          voice: voiceEnabled,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403)
          throw new Error(
            data.error || "The Oracle is on Sync Prepared.",
          );
        if (res.status === 429)
          throw new Error(
            data.error ||
              "You've used all your agent runs this cycle.",
          );
        throw new Error(data.error || "The Wiki stayed quiet.");
      }
      const data = await res.json();
      let audioUrl: string | null = null;
      if (data.voice?.audio_base64) {
        audioUrl = `data:${data.voice.mime ?? "audio/mpeg"};base64,${data.voice.audio_base64}`;
      }
      const oracleTurn: ChatTurn = {
        id: `o-${Date.now()}`,
        role: "oracle",
        text: String(data.answer ?? ""),
        nextMove: data.next_move ?? null,
        confidence: data.confidence ?? null,
        audioUrl,
        voiceError: data.voice?.error ?? null,
      };
      setTurns((prev) => [...prev, oracleTurn]);
      if (audioUrl && voiceEnabled) {
        // Auto-play the new answer
        setTimeout(() => playTurn(oracleTurn), 30);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Oracle failed");
    } finally {
      setLoading(false);
    }
  };

  const playTurn = (turn: ChatTurn) => {
    if (!turn.audioUrl) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(turn.audioUrl);
    audioRef.current = audio;
    setPlaying(turn.id);
    onSpeakingChange?.(true);
    audio.addEventListener("ended", () => {
      setPlaying(null);
      onSpeakingChange?.(false);
    });
    audio.addEventListener("pause", () => {
      setPlaying(null);
      onSpeakingChange?.(false);
    });
    audio.addEventListener("error", () => {
      setPlaying(null);
      onSpeakingChange?.(false);
      toast.error("Audio playback failed");
    });
    audio.play().catch(() => {
      setPlaying(null);
      onSpeakingChange?.(false);
    });
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlaying(null);
    onSpeakingChange?.(false);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col h-full w-full overflow-hidden",
        "border-l border-white/10 backdrop-blur-2xl",
      )}
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(10,10,12,0.92) 40%, rgba(0,0,0,0.96) 100%)",
        boxShadow: "-24px 0 48px -12px rgba(220,38,38,0.22), inset 1px 0 0 rgba(220,38,38,0.3)",
      }}
    >
      {/* Red laser top */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[1px] opacity-90"
        style={{
          background:
            "linear-gradient(90deg, transparent, #DC2626, transparent)",
          boxShadow: "0 0 12px #DC2626",
        }}
      />

      {/* Scanline wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 3px)",
        }}
      />

      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-3 border-b border-white/5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative size-2">
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" />
              <span className="relative block size-2 rounded-full bg-red-500" />
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-red-500/90">
              The Oracle
            </p>
          </div>
          <button
            type="button"
            onClick={() => setVoiceEnabled((v) => !v)}
            className="text-white/50 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] uppercase tracking-wider"
            aria-label={voiceEnabled ? "Mute voice" : "Unmute voice"}
          >
            {voiceEnabled ? (
              <Volume2 className="size-3.5" />
            ) : (
              <VolumeX className="size-3.5" />
            )}
            {voiceEnabled ? "Voice on" : "Muted"}
          </button>
        </div>
        <h3 className="text-xl font-semibold text-white tracking-tight mt-1 leading-tight">
          Ask your Brand Wiki anything.
        </h3>
        <p className="text-xs text-white/50 leading-snug mt-1">
          Every answer is grounded in your wiki
          {focusModule ? (
            <> · scoped to your <span className="text-red-300">{focusModule}</span> module</>
          ) : null}
          .
        </p>
      </div>

      {/* Chat stream */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3 relative z-10"
      >
        {turns.length === 0 && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              Try asking
            </p>
            <div className="space-y-1.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => ask(prompt)}
                  className="w-full text-left rounded-md border border-red-500/15 bg-red-500/[0.03] px-3 py-2 text-xs text-white/75 hover:border-red-500/40 hover:bg-red-500/[0.07] hover:text-white transition-colors flex items-start gap-2"
                >
                  <Sparkles className="size-3 text-red-400 mt-0.5 shrink-0" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn) =>
          turn.role === "user" ? (
            <div key={turn.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/85">
                {turn.text}
              </div>
            </div>
          ) : (
            <OracleMessage
              key={turn.id}
              turn={turn}
              isPlaying={playing === turn.id}
              onPlay={() => playTurn(turn)}
              onStop={stopPlayback}
            />
          ),
        )}

        {loading && (
          <div className="flex items-center gap-2 text-[11px] text-white/50">
            <Loader2 className="size-3 animate-spin" />
            The Wiki is composing…
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-5 py-4 border-t border-white/5 relative z-10 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
          className="flex gap-2"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              loading ? "…" : "Ask about your brand"
            }
            disabled={loading}
            className="bg-zinc-950 border-white/10 text-white"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim() || loading}
            className="bg-red-600 hover:bg-red-500 text-white shrink-0"
            aria-label="Ask"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] uppercase tracking-wider text-white/30 hover:text-white/70 transition-colors"
          >
            Back to Dossier
          </button>
        )}
      </div>

      {/* Red laser bottom */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-[1px] opacity-70"
        style={{
          background:
            "linear-gradient(90deg, transparent, #DC2626, transparent)",
          boxShadow: "0 0 10px #DC2626",
        }}
      />
    </div>
  );
}

function OracleMessage({
  turn,
  isPlaying,
  onPlay,
  onStop,
}: {
  turn: ChatTurn;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}) {
  return (
    <div className="relative rounded-lg border border-red-500/20 bg-red-500/[0.03] p-3 space-y-2 overflow-hidden">
      <span
        aria-hidden
        className="absolute left-0 top-2 bottom-2 w-[2px] bg-red-500/70"
        style={{ boxShadow: "0 0 8px rgba(220,38,38,0.6)" }}
      />
      <div className="flex items-start gap-2 pl-2">
        <Mic className="size-3 text-red-400 mt-1 shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <p className="text-xs text-white/90 leading-relaxed whitespace-pre-wrap break-words">
            {turn.text}
          </p>
          {turn.nextMove && (
            <p className="text-[11px] text-red-300/90 leading-snug">
              <span className="text-[9px] uppercase tracking-wider text-red-400/70 mr-1.5">
                Next
              </span>
              {turn.nextMove}
            </p>
          )}
          <div className="flex items-center gap-2">
            {turn.audioUrl ? (
              <button
                type="button"
                onClick={isPlaying ? onStop : onPlay}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-wider text-red-200 hover:bg-red-500/[0.12] transition-colors"
              >
                {isPlaying ? (
                  <Pause className="size-3" />
                ) : (
                  <Play className="size-3" />
                )}
                {isPlaying ? "Pause" : "Play voice"}
              </button>
            ) : turn.voiceError ? (
              <span className="text-[10px] text-white/30 italic">
                voice unavailable
              </span>
            ) : null}
            {turn.confidence != null && (
              <span className="text-[10px] text-white/30 tabular-nums">
                conf · {Math.round(turn.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
