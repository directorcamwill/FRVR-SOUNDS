"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Music,
  GitBranch,
  Send,
  Brain,
  Activity,
  Settings,
  Sparkles,
  DollarSign,
  Briefcase,
  GraduationCap,
  CalendarDays,
  Target,
  ListChecks,
  Lightbulb,
  FlaskConical,
  Palette,
  BookOpen,
  Film,
  UserRound,
  Library,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlowDot } from "@/components/ui/motion";
import { Lock } from "lucide-react";
import type { FeatureKey, PlanId } from "@/lib/plans";
import { PLANS, planHasFeature } from "@/lib/plans";
import { UpgradeDialog } from "@/components/ui/feature-gate";

const BRAND_WIKI_ENABLED =
  process.env.NEXT_PUBLIC_BRAND_WIKI === "true";

// `feature` optional — when set, item is locked unless the user's plan
// includes that feature key. No key = always unlocked for paying accounts.
interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  feature?: FeatureKey;
}

const coreItems: NavItem[] = [
  { label: "Command Center", href: "/command-center", icon: LayoutDashboard },
  ...(BRAND_WIKI_ENABLED
    ? [{ label: "Brand", href: "/brand", icon: Palette, feature: "brand_wiki_edit" as FeatureKey }]
    : []),
  { label: "Song Vault", href: "/vault", icon: Music, feature: "song_vault" },
  { label: "Pipeline", href: "/pipeline", icon: GitBranch, feature: "pipeline_tracking" },
  { label: "Submissions", href: "/submissions", icon: Send, feature: "pipeline_tracking" },
  { label: "Song Lab", href: "/song-lab", icon: FlaskConical, feature: "song_lab_projects" },
];

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "CORE",
    items: coreItems,
  },
  {
    label: "INTELLIGENCE",
    items: [
      { label: "Intelligence", href: "/intelligence", icon: Brain },
      { label: "Content", href: "/content", icon: Sparkles, feature: "ai_content_director" },
      { label: "Sync Directory", href: "/sync-directory", icon: BookOpen, feature: "sync_directory" },
      { label: "Placements", href: "/placements", icon: Film, feature: "placements_reference" },
      { label: "Supervisors", href: "/supervisors", icon: UserRound, feature: "supervisor_directory" },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { label: "Business", href: "/business", icon: Briefcase, feature: "money_llc" },
      { label: "Money", href: "/money", icon: DollarSign, feature: "money_llc" },
      { label: "Learn", href: "/learn", icon: GraduationCap },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "Timeline", href: "/timeline", icon: CalendarDays },
      { label: "Deliverables", href: "/deliverables", icon: Target, feature: "package_builder" },
      { label: "Daily Tasks", href: "/daily", icon: ListChecks },
      { label: "Ideas", href: "/ideas", icon: Lightbulb },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Health", href: "/health", icon: Activity },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const systemAgents = [
  { label: "Sync Engine", status: "active" as const },
  { label: "Orchestrator", status: "active" as const },
  { label: "Health Monitor", status: "active" as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [upgradeFeature, setUpgradeFeature] = useState<FeatureKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setIsSuperAdmin(!!data.is_super_admin);
          setPlanId((data.plan_id ?? null) as PlanId | null);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const itemUnlocked = (item: NavItem) => {
    if (isSuperAdmin) return true;
    if (!item.feature) return true;
    if (!planId) return false;
    return planHasFeature(planId, item.feature);
  };

  const groupsWithAdmin = isSuperAdmin
    ? [
        ...navGroups,
        {
          label: "OPERATOR",
          items: [
            { label: "Admin Console", href: "/admin", icon: Shield } as NavItem,
          ],
        },
      ]
    : navGroups;

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 bg-black border-r border-[#1A1A1A] z-30">
      {/* Left edge red glow line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-red-600/40 to-transparent" />

      {/* Logo */}
      <div className="px-6 pt-6 pb-1">
        <h1 className="text-xl font-bold tracking-wider chrome-text">FRVR</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-red-500/80 font-medium">Sounds</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 mt-4 overflow-y-auto">
        {groupsWithAdmin.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500/60">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              const unlocked = itemUnlocked(item);
              if (!unlocked) {
                return (
                  <motion.div
                    key={item.href}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.15 }}
                  >
                    <button
                      onClick={() =>
                        item.feature && setUpgradeFeature(item.feature)
                      }
                      className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full text-left text-[#555] hover:text-[#A3A3A3] hover:bg-white/[0.02] transition-all"
                    >
                      <Icon className="size-4" />
                      <span className="flex-1 truncate">{item.label}</span>
                      <Lock className="size-3 text-[#444]" />
                    </button>
                  </motion.div>
                );
              }
              return (
                <motion.div
                  key={item.href}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.15 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-red-500 bg-red-500/10"
                        : "text-[#666] hover:text-white hover:bg-white/[0.03]"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.6)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* System Status */}
      <div className="px-4 py-4 border-t border-[#1A1A1A]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#444] mb-3">
          System Status
        </p>
        <div className="space-y-2">
          {systemAgents.map((agent) => (
            <div key={agent.label} className="flex items-center gap-2">
              <GlowDot color="green" size="sm" />
              <span className="text-[11px] text-[#555]">{agent.label}</span>
            </div>
          ))}
        </div>
      </div>
      {upgradeFeature && (
        <UpgradeDialog
          open={!!upgradeFeature}
          onClose={() => setUpgradeFeature(null)}
          feature={upgradeFeature}
          label={PLANS[planId ?? "starter"]?.name}
        />
      )}
    </aside>
  );
}
