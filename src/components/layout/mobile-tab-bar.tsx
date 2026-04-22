"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Music,
  Library,
  GitBranch,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

const TABS: Tab[] = [
  {
    label: "Home",
    href: "/command-center",
    icon: Home,
    match: (p) => p === "/command-center" || p.startsWith("/command-center/"),
  },
  {
    label: "Vault",
    href: "/vault",
    icon: Music,
    match: (p) => p.startsWith("/vault") || p.startsWith("/song-lab"),
  },
  {
    label: "Catalog",
    href: "/catalog",
    icon: Library,
    match: (p) => p.startsWith("/catalog"),
  },
  {
    label: "Pipeline",
    href: "/pipeline",
    icon: GitBranch,
    match: (p) => p.startsWith("/pipeline") || p.startsWith("/submissions"),
  },
  {
    label: "Me",
    href: "/settings",
    icon: User,
    match: (p) => p.startsWith("/settings") || p.startsWith("/brand"),
  },
];

export function MobileTabBar() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 md:hidden",
        "border-t border-white/10 bg-black/85 backdrop-blur-xl",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="contents">
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] uppercase tracking-[0.18em] transition-colors",
                  active ? "text-[#DC2626]" : "text-white/50 hover:text-white/80",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "relative flex items-center justify-center size-6",
                    active && "drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -top-2 h-[2px] w-6 rounded-full bg-[#DC2626] shadow-[0_0_8px_rgba(220,38,38,0.8)]"
                    />
                  )}
                </span>
                <span className="leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
