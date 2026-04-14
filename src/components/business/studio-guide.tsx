"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Headphones,
  Monitor,
  Mic,
  Music,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BudgetTier = "low" | "mid" | "high";

interface GearItem {
  name: string;
  product: string;
  price: string;
  priority: number;
}

const GEAR_TIERS: Record<BudgetTier, { label: string; range: string; items: GearItem[] }> = {
  low: {
    label: "Low Budget",
    range: "$200 - $500",
    items: [
      { name: "Audio Interface", product: "Focusrite Scarlett Solo", price: "~$120", priority: 1 },
      { name: "Microphone", product: "Audio-Technica AT2020", price: "~$100", priority: 2 },
      { name: "Headphones", product: "Audio-Technica ATH-M50x", price: "~$150", priority: 3 },
      { name: "DAW", product: "GarageBand (free) or Reaper ($60)", price: "Free - $60", priority: 4 },
    ],
  },
  mid: {
    label: "Mid Budget",
    range: "$500 - $1,500",
    items: [
      { name: "Audio Interface", product: "Universal Audio Volt 276", price: "~$300", priority: 1 },
      { name: "Microphone", product: "Rode NT1-A", price: "~$230", priority: 2 },
      { name: "Monitors", product: "Yamaha HS5 (pair)", price: "~$400", priority: 3 },
      { name: "Headphones", product: "Beyerdynamic DT 770 Pro", price: "~$160", priority: 4 },
      { name: "DAW", product: "Logic Pro ($200) or Ableton Standard ($450)", price: "$200 - $450", priority: 5 },
    ],
  },
  high: {
    label: "High End",
    range: "$1,500 - $5,000+",
    items: [
      { name: "Audio Interface", product: "Universal Audio Apollo Twin", price: "~$900", priority: 1 },
      { name: "Microphone", product: "Neumann TLM 103", price: "~$1,100", priority: 2 },
      { name: "Monitors", product: "Adam Audio A7V (pair)", price: "~$900", priority: 3 },
      { name: "Headphones", product: "Audeze LCD-X", price: "~$1,200", priority: 4 },
      { name: "DAW", product: "Ableton Suite ($750) or Logic Pro ($200)", price: "$200 - $750", priority: 5 },
      { name: "Acoustic Treatment", product: "Panels + bass traps", price: "~$500 - $1,000", priority: 6 },
    ],
  },
};

const GEAR_ICONS: Record<string, typeof Headphones> = {
  "Audio Interface": Monitor,
  Microphone: Mic,
  Headphones: Headphones,
  Monitors: Monitor,
  DAW: Music,
  "Acoustic Treatment": Lightbulb,
};

const STUDIO_TIPS = [
  {
    title: "Before a studio session",
    tips: [
      "Have your song fully demoed and arranged before booking",
      "Create a reference playlist of 3-5 songs with the sound you want",
      "Export all stems, MIDI files, and project files to a portable drive",
      "Write down BPM, key, and any specific effects you want",
    ],
  },
  {
    title: "What to bring",
    tips: [
      "External hard drive with your project files",
      "Reference tracks on your phone or a playlist link",
      "Lyrics sheets (printed, not just on your phone)",
      "Water and snacks -- sessions can run long",
      "Notebook for taking notes on mixing decisions",
    ],
  },
  {
    title: "Working with engineers",
    tips: [
      "Communicate with references, not technical jargon",
      "Say 'I want it to sound like this song' rather than 'add 3dB at 2kHz'",
      "Trust their expertise but speak up if something doesn't sound right",
      "Ask for stems and a project backup at the end of every session",
    ],
  },
  {
    title: "When to book vs. work from home",
    tips: [
      "Book a studio for: final vocals, mixing, mastering, live instruments",
      "Work from home for: writing, arranging, producing beats, rough demos",
      "A good home setup covers 80% of what you need",
      "Save studio budget for the things that really need professional gear",
    ],
  },
];

export function StudioGuide() {
  const [selectedTier, setSelectedTier] = useState<BudgetTier>("low");
  const [showTips, setShowTips] = useState(false);

  const tier = GEAR_TIERS[selectedTier];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Headphones className="size-4 text-[#DC2626]" />
            Studio Setup Guide
          </CardTitle>
          <p className="text-xs text-[#A3A3A3]">
            Gear recommendations by budget. Buy in priority order.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Budget selector */}
          <div className="flex gap-2">
            {(Object.keys(GEAR_TIERS) as BudgetTier[]).map((key) => (
              <Button
                key={key}
                variant={selectedTier === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTier(key)}
                className={cn(
                  "text-xs",
                  selectedTier === key && "bg-[#DC2626] hover:bg-[#DC2626]/90"
                )}
              >
                {GEAR_TIERS[key].label}
              </Button>
            ))}
          </div>

          {/* Budget range */}
          <p className="text-sm text-[#A3A3A3]">
            Budget range:{" "}
            <span className="text-white font-medium">{tier.range}</span>
          </p>

          {/* Gear list */}
          <div className="space-y-2">
            {tier.items.map((item) => {
              const Icon = GEAR_ICONS[item.name] || Monitor;
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-black border border-[#1A1A1A]"
                >
                  <div className="flex items-center justify-center size-6 rounded bg-[#1A1A1A] text-[10px] font-bold text-[#DC2626]">
                    {item.priority}
                  </div>
                  <Icon className="size-4 text-[#555]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{item.name}</p>
                    <p className="text-xs text-[#A3A3A3]">{item.product}</p>
                  </div>
                  <span className="text-xs text-[#777] tabular-nums shrink-0">
                    {item.price}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-[#555] italic">
            Buy in numbered order. Each item builds on the previous one.
          </p>
        </CardContent>
      </Card>

      {/* Studio Session Tips */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowTips(!showTips)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="size-4 text-amber-400" />
              Studio Session Strategy
            </CardTitle>
            {showTips ? (
              <ChevronUp className="size-4 text-[#555]" />
            ) : (
              <ChevronDown className="size-4 text-[#555]" />
            )}
          </div>
          <p className="text-xs text-[#A3A3A3]">
            How to prepare, what to bring, and when to book
          </p>
        </CardHeader>
        {showTips && (
          <CardContent className="pt-0 space-y-4">
            {STUDIO_TIPS.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-medium text-white mb-2">
                  {section.title}
                </h4>
                <ul className="space-y-1.5">
                  {section.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-[#A3A3A3]"
                    >
                      <span className="text-[#DC2626] mt-0.5 shrink-0">
                        &bull;
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
