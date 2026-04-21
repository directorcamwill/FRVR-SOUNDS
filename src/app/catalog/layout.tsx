import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FRVR SOUNDS — Catalog",
  description:
    "A sync-licensable catalog organized as rooms. Find the right song for the moment.",
};

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden grain">
      {/* Aurora ambient gradients */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div
          className="aurora"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(220, 38, 38, 0.35), transparent 60%)",
          }}
        />
        <div
          className="aurora"
          style={{
            background:
              "radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.25), transparent 60%)",
            animationDelay: "-10s",
          }}
        />
        <div
          className="aurora"
          style={{
            background:
              "radial-gradient(circle at 50% 100%, rgba(0, 224, 255, 0.12), transparent 60%)",
            animationDelay: "-18s",
          }}
        />
      </div>

      {/* Top nav — minimal, cinematic */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 mix-blend-difference">
        <Link
          href="/catalog"
          className="flex items-baseline gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="font-display text-lg font-black tracking-tight text-[#DC2626]">
            FRVR
          </span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/70">
            Sounds
          </span>
        </Link>

        <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.25em] text-[#DC2626]/85">
          <Link href="/catalog" className="hover:text-[#DC2626] transition-colors">
            Lobby
          </Link>
          <Link
            href="/catalog/search"
            className="hover:text-[#DC2626] transition-colors hidden md:inline"
          >
            Search
          </Link>
          <Link
            href="/submit"
            className="hover:text-[#DC2626] transition-colors hidden md:inline"
          >
            Submit
          </Link>
        </div>
      </nav>

      {/* Content layer */}
      <main className="relative z-10">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-32 py-12 px-6 md:px-10 text-[11px] uppercase tracking-[0.25em] text-white/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-sm text-white/80">
              FRVR
            </span>
            <span>Sounds · Sync Licensing</span>
          </div>
          <div className="flex gap-6">
            <Link href="/submit" className="hover:text-white/80 transition-colors">
              Submit
            </Link>
            <Link href="/pricing" className="hover:text-white/80 transition-colors">
              For Artists
            </Link>
            <Link
              href="/catalog/search"
              className="hover:text-white/80 transition-colors"
            >
              Search Catalog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
