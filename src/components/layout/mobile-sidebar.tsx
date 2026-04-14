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
  DollarSign,
  GraduationCap,
  Activity,
  Settings,
  CalendarDays,
  Target,
  ListChecks,
  Lightbulb,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Command Center", href: "/command-center", icon: LayoutDashboard },
  { label: "Song Vault", href: "/vault", icon: Music },
  { label: "Pipeline", href: "/pipeline", icon: GitBranch },
  { label: "Submissions", href: "/submissions", icon: Send },
  { label: "Song Lab", href: "/song-lab", icon: FlaskConical },
  { label: "Intelligence", href: "/intelligence", icon: Brain },
  { label: "Content", href: "/content", icon: Sparkles },
  { label: "Business", href: "/business", icon: Briefcase },
  { label: "Money", href: "/money", icon: DollarSign },
  { label: "Learn", href: "/learn", icon: GraduationCap },
  { label: "---", href: "", icon: LayoutDashboard },
  { label: "Timeline", href: "/timeline", icon: CalendarDays },
  { label: "Deliverables", href: "/deliverables", icon: Target },
  { label: "Daily Tasks", href: "/daily", icon: ListChecks },
  { label: "Ideas", href: "/ideas", icon: Lightbulb },
  { label: "---", href: "", icon: LayoutDashboard },
  { label: "Health", href: "/health", icon: Activity },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Logo */}
      <div className="px-6 pt-6 pb-1">
        <h1 className="text-xl font-bold tracking-wider chrome-text">FRVR</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-red-500/80 font-medium">Sounds</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 mt-4 overflow-y-auto">
        {navItems.map((item, idx) => {
          if (item.label === "---") {
            return (
              <div
                key={`sep-${idx}`}
                className="my-2 mx-3 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent"
              />
            );
          }
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-red-500 bg-red-500/10"
                  : "text-[#666] hover:text-white hover:bg-white/[0.03]"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
              )}
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
