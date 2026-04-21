"use client";

import { use, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Printer, ShieldCheck } from "lucide-react";

interface BriefPitch {
  id: string;
  pitch_slug: string;
  target_name: string;
  target_company: string | null;
  view_count: number;
  opened_at: string | null;
  sent_at: string;
}

interface BriefDeal {
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
  deal_type: string;
  signed_audio_url: string | null;
}

export default function PitchBriefPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [pitch, setPitch] = useState<BriefPitch | null>(null);
  const [deal, setDeal] = useState<BriefDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/library/briefs/${slug}`);
        if (!res.ok) throw new Error("Brief not found");
        const data = await res.json();
        setPitch(data.pitch);
        setDeal(data.deal);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Brief not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading)
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <p className="text-sm text-[#A3A3A3]">Loading brief…</p>
      </main>
    );
  if (error || !pitch || !deal)
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <p className="text-sm text-[#A3A3A3]">{error || "Brief not found"}</p>
      </main>
    );

  return (
    <main className="min-h-screen bg-black py-10 print:bg-white print:py-4">
      <div className="max-w-3xl mx-auto px-6 space-y-6">
        {/* Print / PDF button — hidden when printing */}
        <div className="flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-[0.2em] text-[#DC2626]">
              FRVR SOUNDS
            </span>
            <Badge
              variant="outline"
              className="text-[9px] bg-[#111] uppercase tracking-wider"
            >
              Pitch Brief
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
          >
            <Printer className="size-3.5 mr-1.5" />
            Save as PDF
          </Button>
        </div>

        {/* Print-only header */}
        <div className="hidden print:block">
          <p className="text-xs font-bold tracking-[0.2em] text-black">
            FRVR SOUNDS · PITCH BRIEF
          </p>
        </div>

        <Card className="print:border-gray-300 print:bg-white">
          <CardContent className="py-6 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#666] print:text-gray-600">
                Prepared for
              </p>
              <p className="text-lg font-semibold text-white print:text-black">
                {pitch.target_name}
                {pitch.target_company && (
                  <span className="text-[#A3A3A3] print:text-gray-600 font-normal">
                    {" "}
                    · {pitch.target_company}
                  </span>
                )}
              </p>
            </div>

            <div className="h-px bg-[#1A1A1A] print:bg-gray-300" />

            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#666] print:text-gray-600">
                Track
              </p>
              <h1 className="text-3xl font-bold text-white print:text-black">
                {deal.song_title}
              </h1>
              <p className="text-base text-[#A3A3A3] print:text-gray-700">
                {deal.artist_name}
              </p>
            </div>

            {deal.signed_audio_url && (
              <audio
                controls
                className="w-full print:hidden"
                src={deal.signed_audio_url}
              />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {deal.genre && (
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#666] print:text-gray-600">
                    Genre
                  </p>
                  <p className="text-sm text-white print:text-black">
                    {deal.genre}
                  </p>
                </div>
              )}
              {deal.bpm && (
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#666] print:text-gray-600">
                    BPM
                  </p>
                  <p className="text-sm text-white print:text-black tabular-nums">
                    {deal.bpm}
                  </p>
                </div>
              )}
              {deal.key && (
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#666] print:text-gray-600">
                    Key
                  </p>
                  <p className="text-sm text-white print:text-black">
                    {deal.key}
                  </p>
                </div>
              )}
              {deal.vocal_type && (
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#666] print:text-gray-600">
                    Vocal
                  </p>
                  <p className="text-sm text-white print:text-black">
                    {deal.vocal_type}
                  </p>
                </div>
              )}
            </div>

            {deal.moods && deal.moods.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#666] print:text-gray-600 mb-1">
                  Mood
                </p>
                <div className="flex flex-wrap gap-1">
                  {deal.moods.map((m) => (
                    <Badge
                      key={m}
                      variant="outline"
                      className="text-[10px] bg-[#111] print:bg-gray-100 print:text-black capitalize"
                    >
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {deal.is_one_stop && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 print:border-gray-400 print:bg-gray-50">
                <p className="text-xs flex items-center gap-2 text-emerald-400 print:text-black font-semibold">
                  <ShieldCheck className="size-3.5" />
                  One-stop — FRVR Sounds controls master + publishing rep.
                  License is a single conversation.
                </p>
              </div>
            )}

            <div className="h-px bg-[#1A1A1A] print:bg-gray-300" />

            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#666] print:text-gray-600 mb-1">
                Licensing
              </p>
              <p className="text-sm text-[#D4D4D4] print:text-black leading-relaxed">
                Available for sync placement in film, TV, trailer, advertising,
                and game contexts. Stems, instrumental, and clean versions on
                request. Contact FRVR Sounds for a quote.
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#666] print:text-gray-600 mb-1">
                Contact
              </p>
              <p className="text-sm text-white print:text-black">
                FRVR Sounds Music Library
              </p>
              <p className="text-xs text-[#A3A3A3] print:text-gray-600">
                Reply to the email that sent this brief, or visit
                frvr-sounds.vercel.app for catalog.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3 print:hidden">
          <p className="text-[11px] text-[#555]">
            Ref: {pitch.pitch_slug} · Viewed {pitch.view_count}{" "}
            {pitch.view_count === 1 ? "time" : "times"}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
          >
            <Download className="size-3.5 mr-1.5" />
            Download PDF
          </Button>
        </div>
      </div>
    </main>
  );
}
