import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

/**
 * Public release notes. Linked from the homepage, sidebar, and email
 * footers. Sections grouped by ship date — newest first. Add new entries
 * at the top of RELEASES; older ones stay in place forever.
 */

export const metadata = {
  title: "What's new · FRVR Sounds",
  description:
    "Release notes — every shipped feature, the day it landed.",
};

interface Entry {
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
  tier?: string;
}

interface Release {
  date: string;
  label: string;
  entries: Entry[];
}

const RELEASES: Release[] = [
  {
    date: "2026-04-24",
    label: "April 24",
    entries: [
      {
        title: "Three new Brand Wiki tools",
        body: "Your finished Wiki now writes your social profile, your photo art direction, and a tiered offer stack — each grounded in the modules you completed.",
        href: "/brand",
        hrefLabel: "Open the Rewards",
        tier: "Sync Prepared",
      },
      {
        title: "Content + Sync Loop",
        body: "When Package Builder turns a song green, one click fans it out — release-day captions across IG · TikTok · X · email, plus a release plan pinned to the song.",
        href: "/vault",
        hrefLabel: "Open Vault",
        tier: "Pro Catalog · Sync Prepared",
      },
      {
        title: "Weekly digest emails",
        body: "Toggle on the digest in Settings → Automations. Every Monday morning your inbox gets a short read on the past 7 days — songs added, library submissions, deals accepted, and what your studio team did.",
        href: "/settings",
        hrefLabel: "Open Settings",
        tier: "All paying tiers",
      },
      {
        title: "BPM + key detection on every catalog upload",
        body: "The audio analyzer now detects tempo and musical key automatically. Tracks that weren't manually tagged still surface real BPM and key tiles in the catalog.",
        href: "/catalog",
        hrefLabel: "See the Catalog",
      },
      {
        title: "Operator console: impersonation, broadcast, plan-change",
        body: "Read-only \"view as\" any artist (with a banner that blocks writes), super-admin email broadcast across paying tiers, and inline plan changes from the account detail dialog.",
        href: "/admin",
        hrefLabel: "Open admin",
        tier: "Super-admin",
      },
    ],
  },
  {
    date: "2026-04-22",
    label: "April 22",
    entries: [
      {
        title: "Brand Wiki v2: 7-module Journey + 3D Constellation + Oracle",
        body: "The Brand tab is a 3-panel journey now — left nav, lesson engine, live wiki. Finish all 7 modules and the Wiki opens as a 3D constellation with a voice-driven Oracle scoped per module.",
        href: "/brand",
        hrefLabel: "Open the Brand Journey",
      },
    ],
  },
  {
    date: "2026-04-21",
    label: "April 21",
    entries: [
      {
        title: "The Catalog · Northwoods estate",
        body: "Spatial lobby with 10 cinematic rooms, each a mood. Real photography, scrub-bar player, shortlists, advanced search, email gate, and a public submission flow.",
        href: "/catalog",
        hrefLabel: "Enter the Catalog",
      },
      {
        title: "7-day trial · quota enforcement · PWA",
        body: "Every plan gets a 7-day trial with a 5-run AI cap; quota is wired across 17 agent routes. PWA shipped with shortcut tiles for Catalog · Vault · Command Center.",
      },
    ],
  },
];

export default function WhatsNewPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-20">
        <header className="space-y-3 mb-12 md:mb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.3em] text-white/40 hover:text-red-400 transition"
          >
            <ArrowRight className="size-3 rotate-180" /> Back
          </Link>
          <p className="text-[10px] uppercase tracking-[0.4em] text-red-400/80">
            Release notes
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
            What we shipped
          </h1>
          <p className="text-sm text-white/60 max-w-xl leading-relaxed">
            Every meaningful change, the day it landed.
          </p>
        </header>

        <div className="space-y-12">
          {RELEASES.map((rel) => (
            <section key={rel.date} className="space-y-4">
              <div className="flex items-baseline gap-3 border-b border-white/5 pb-2">
                <h2 className="text-lg font-semibold text-white">{rel.label}</h2>
                <span className="text-[11px] font-mono text-white/30">
                  {rel.date}
                </span>
              </div>
              <ul className="space-y-4">
                {rel.entries.map((e, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-white/5 bg-white/[0.01] p-4 space-y-2"
                  >
                    <div className="flex items-start gap-3 flex-wrap">
                      <h3 className="text-base font-medium text-white flex-1 min-w-0 leading-snug">
                        {e.title}
                      </h3>
                      {e.tier && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-red-400/80 shrink-0">
                          {e.tier}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {e.body}
                    </p>
                    {e.href && (
                      <Link
                        href={e.href}
                        className="inline-flex items-center gap-1 text-[12px] text-red-400 hover:text-red-300 transition"
                      >
                        {e.hrefLabel ?? "Open"}
                        <ArrowUpRight className="size-3" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
