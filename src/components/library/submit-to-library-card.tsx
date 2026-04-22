"use client";

import { useState } from "react";
import { Send, Sparkles, ArrowRight } from "lucide-react";
import { LibrarySubmitDialog } from "./submit-dialog";

// Non-dismissible promotion card for the Command Center.
// Encourages signed-in artists to submit a track to the FRVR Sounds library.

export function SubmitToLibraryCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-[#DC2626]/30 bg-gradient-to-r from-[#DC2626]/10 via-[#DC2626]/5 to-transparent p-5 md:p-6">
        <div
          aria-hidden
          className="absolute -right-20 -top-20 size-64 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(220,38,38,0.25) 0%, transparent 70%)" }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-[0.35em] text-[#DC2626] font-semibold">
                FRVR Sounds Library
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-white/50">
                <Sparkles className="size-3" />
                Placement pipeline
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-white leading-tight">
              Get your track into the catalog.
            </h3>
            <p className="mt-1.5 text-sm text-[#D4D4D4] leading-relaxed max-w-xl">
              We pitch our catalog monthly to music supervisors across film, TV, trailers, ads,
              and games. Pick a deal track — <span className="text-white font-medium">Rev-Share 60/40</span>{" "}
              or <span className="text-white font-medium">$99 Upfront (80/20)</span> — and upload. Reviews in 7–14 days.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#DC2626] text-white text-xs uppercase tracking-[0.25em] font-semibold hover:bg-[#B91C1C] transition-colors shadow-lg shadow-[#DC2626]/20"
          >
            <Send className="size-3.5" />
            Submit a song
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
      <LibrarySubmitDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
