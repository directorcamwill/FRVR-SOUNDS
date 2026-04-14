"use client";

import { cn } from "@/lib/utils";
import type { KnowledgeTopic } from "@/lib/knowledge/topics";
import { KNOWLEDGE_TOPICS } from "@/lib/knowledge/topics";
import {
  ICON_MAP,
  CATEGORY_ICON_BG,
  CATEGORY_ICON_COLOR,
  CATEGORY_COLORS,
} from "./topic-card";
import {
  ArrowLeft,
  AlertTriangle,
  Lightbulb,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopicDetailProps {
  topic: KnowledgeTopic;
  onBack: () => void;
  onNavigate: (topicId: string) => void;
}

export function TopicDetail({ topic, onBack, onNavigate }: TopicDetailProps) {
  const Icon = ICON_MAP[topic.icon] || FileText;

  const relatedTopics = topic.related
    .map((id) => KNOWLEDGE_TOPICS.find((t) => t.id === id))
    .filter(Boolean) as KnowledgeTopic[];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="text-[#A3A3A3] hover:text-white -ml-2"
      >
        <ArrowLeft className="size-4 mr-1" />
        Back to Knowledge Base
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "size-12 rounded-xl flex items-center justify-center shrink-0",
            "animate-[fadeSlideIn_0.3s_ease_forwards] opacity-0",
            CATEGORY_ICON_BG[topic.category] || "bg-[#1A1A1A]"
          )}
        >
          <Icon
            className={cn(
              "size-6",
              CATEGORY_ICON_COLOR[topic.category] || "text-[#A3A3A3]"
            )}
          />
        </div>
        <div>
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider inline-block mb-2",
              CATEGORY_COLORS[topic.category] ||
                "text-[#A3A3A3] bg-[#1A1A1A] border-[#333]"
            )}
          >
            {topic.category}
          </span>
          <h2 className="text-xl font-bold text-white">{topic.title}</h2>
          <p className="text-sm text-[#A3A3A3] mt-1">{topic.subtitle}</p>
        </div>
      </div>

      {/* What is this? */}
      <section className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-5 space-y-2">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          What is this?
        </h3>
        <p className="text-sm text-[#CCCCCC] leading-relaxed">
          {topic.content.what}
        </p>
      </section>

      {/* Why does it matter? */}
      <section className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-5 space-y-2">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Why does it matter?
        </h3>
        <p className="text-sm text-[#CCCCCC] leading-relaxed">
          {topic.content.why}
        </p>
      </section>

      {/* How to do it */}
      <section className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          How to do it
        </h3>
        <ol className="space-y-3">
          {topic.content.how.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 animate-[fadeSlideIn_0.3s_ease_forwards] opacity-0"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="size-6 rounded-full bg-[#DC2626]/15 text-[#DC2626] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-[#CCCCCC] leading-relaxed">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Watch out for */}
      <section className="bg-red-950/10 border border-red-500/20 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="size-4" />
          Watch out for
        </h3>
        <ul className="space-y-3">
          {topic.content.watch_out.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 animate-[fadeSlideIn_0.3s_ease_forwards] opacity-0"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <AlertTriangle className="size-4 text-red-400/60 shrink-0 mt-0.5" />
              <span className="text-sm text-red-200/80 leading-relaxed">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pro tip */}
      <section className="bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-[#DC2626]/15 flex items-center justify-center shrink-0">
            <Lightbulb className="size-4 text-[#DC2626]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#DC2626] mb-1">
              Pro Tip
            </h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              {topic.content.pro_tip}
            </p>
          </div>
        </div>
      </section>

      {/* Related Topics */}
      {relatedTopics.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Related Topics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {relatedTopics.map((related) => {
              const RelIcon = ICON_MAP[related.icon] || FileText;
              return (
                <button
                  key={related.id}
                  onClick={() => onNavigate(related.id)}
                  className="flex items-center gap-3 bg-[#111111] border border-[#1A1A1A] rounded-lg p-3 hover:border-[#333] hover:bg-[#141414] transition-all text-left group"
                >
                  <div
                    className={cn(
                      "size-8 rounded-lg flex items-center justify-center shrink-0",
                      CATEGORY_ICON_BG[related.category] || "bg-[#1A1A1A]"
                    )}
                  >
                    <RelIcon
                      className={cn(
                        "size-4",
                        CATEGORY_ICON_COLOR[related.category] ||
                          "text-[#A3A3A3]"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white group-hover:text-[#DC2626] transition-colors truncate">
                      {related.title}
                    </p>
                    <p className="text-xs text-[#666] truncate">
                      {related.category}
                    </p>
                  </div>
                  <ChevronRight className="size-3 text-[#333] group-hover:text-[#DC2626] transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
