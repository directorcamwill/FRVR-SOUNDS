"use client";

import { cn } from "@/lib/utils";
import type { KnowledgeTopic } from "@/lib/knowledge/topics";
import {
  DollarSign,
  Radio,
  Disc,
  Tv,
  Lock,
  Zap,
  Shield,
  HandCoins,
  FileCheck,
  Globe,
  FileText,
  Copyright,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  DollarSign,
  Radio,
  Disc,
  Tv,
  Lock,
  Zap,
  Shield,
  HandCoins,
  FileCheck,
  Globe,
  FileText,
  Copyright,
};

const CATEGORY_COLORS: Record<string, string> = {
  Royalties: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Ownership: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Registration: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Business: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

const CATEGORY_ICON_BG: Record<string, string> = {
  Royalties: "bg-emerald-400/10",
  Ownership: "bg-blue-400/10",
  Registration: "bg-amber-400/10",
  Business: "bg-purple-400/10",
};

const CATEGORY_ICON_COLOR: Record<string, string> = {
  Royalties: "text-emerald-400",
  Ownership: "text-blue-400",
  Registration: "text-amber-400",
  Business: "text-purple-400",
};

interface TopicCardProps {
  topic: KnowledgeTopic;
  index: number;
  onClick: (topicId: string) => void;
}

export function TopicCard({ topic, index, onClick }: TopicCardProps) {
  const Icon = ICON_MAP[topic.icon] || FileText;

  return (
    <button
      onClick={() => onClick(topic.id)}
      className={cn(
        "w-full text-left bg-[#111111] border border-[#1A1A1A] rounded-xl p-5",
        "hover:border-[#333] hover:bg-[#141414] transition-all duration-200",
        "group cursor-pointer"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "size-10 rounded-lg flex items-center justify-center shrink-0",
            "animate-[fadeSlideIn_0.3s_ease_forwards] opacity-0",
            CATEGORY_ICON_BG[topic.category] || "bg-[#1A1A1A]"
          )}
          style={{ animationDelay: `${index * 50 + 100}ms` }}
        >
          <Icon
            className={cn(
              "size-5",
              CATEGORY_ICON_COLOR[topic.category] || "text-[#A3A3A3]"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider",
                CATEGORY_COLORS[topic.category] || "text-[#A3A3A3] bg-[#1A1A1A] border-[#333]"
              )}
            >
              {topic.category}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-[#DC2626] transition-colors">
            {topic.title}
          </h3>
          <p className="text-xs text-[#A3A3A3] mt-0.5 line-clamp-2">
            {topic.subtitle}
          </p>
        </div>
        <ChevronRight className="size-4 text-[#333] group-hover:text-[#DC2626] transition-colors shrink-0 mt-1" />
      </div>
    </button>
  );
}

export { ICON_MAP, CATEGORY_COLORS, CATEGORY_ICON_BG, CATEGORY_ICON_COLOR };
