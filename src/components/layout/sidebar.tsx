"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Music,
  GitBranch,
  Send,
  Brain,
  Sparkles,
  Briefcase,
  Activity,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Command Center", href: "/command-center", icon: LayoutDashboard },
  { label: "Song Vault", href: "/vault", icon: Music },
  { label: "Pipeline", href: "/pipeline", icon: GitBranch },
  { label: "Submissions", href: "/submissions", icon: Send },
  { label: "Intelligence", href: "/intelligence", icon: Brain },
  { label: "Content", href: "/content", icon: Sparkles },
  { label: "Business", href: "/business", icon: Briefcase },
  { label: "Health", href: "/health", icon: Activity },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 bg-[#0A0A0A] border-r border-[#1F1F1F] z-30">
      {/* Logo */}
      <div className="flex items-center gap-1 px-6 py-5">
        <span className="text-xl font-bold text-[#E87420]">FRVR</span>
        <span className="text-xl font-bold text-white">SOUNDS</span>
      </div>
      <p className="px-6 -mt-3 mb-4 text-xs text-[#A3A3A3]">
        AI Artist Command Center
      </p>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "border-l-2 border-[#E87420] text-[#E87420] bg-[#1A1A1A]"
                  : "text-[#A3A3A3] hover:text-white hover:bg-[#111111]"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user section */}
      <div className="px-4 py-4 border-t border-[#1F1F1F]">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-xs text-[#A3A3A3]">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">Artist</p>
            <p className="text-xs text-[#A3A3A3] truncate">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
