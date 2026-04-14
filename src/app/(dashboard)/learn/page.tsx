"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  KNOWLEDGE_TOPICS,
  KNOWLEDGE_CATEGORIES,
} from "@/lib/knowledge/topics";
import { TopicCard } from "@/components/learn/topic-card";
import { TopicDetail } from "@/components/learn/topic-detail";
import { AskAI } from "@/components/learn/ask-ai";
import {
  Search,
  GraduationCap,
  DollarSign,
  Shield,
  FileCheck,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  DollarSign,
  Shield,
  FileCheck,
  Briefcase,
};

function LearnPageFallback() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-12 w-64 bg-[#1A1A1A]" />
      <Skeleton className="h-32 bg-[#1A1A1A]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 bg-[#1A1A1A]" />
        ))}
      </div>
    </div>
  );
}

function LearnPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    searchParams.get("topic") || null
  );

  // Handle topic param from URL
  useEffect(() => {
    const topicParam = searchParams.get("topic");
    if (topicParam) {
      setSelectedTopicId(topicParam);
    }
  }, [searchParams]);

  const filteredTopics = useMemo(() => {
    return KNOWLEDGE_TOPICS.filter((topic) => {
      const matchesCategory =
        !selectedCategory || topic.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const selectedTopic = selectedTopicId
    ? KNOWLEDGE_TOPICS.find((t) => t.id === selectedTopicId)
    : null;

  function handleTopicClick(topicId: string) {
    setSelectedTopicId(topicId);
    router.push(`/learn?topic=${topicId}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setSelectedTopicId(null);
    router.push("/learn", { scroll: false });
  }

  // If a topic is selected, show its detail
  if (selectedTopic) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <TopicDetail
          topic={selectedTopic}
          onBack={handleBack}
          onNavigate={handleTopicClick}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-[#DC2626]/15 flex items-center justify-center shrink-0 animate-[fadeSlideIn_0.3s_ease_forwards] opacity-0">
          <GraduationCap className="size-5 text-[#DC2626]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Knowledge Base</h2>
          <p className="text-sm text-[#A3A3A3]">
            Everything you need to know about the music business
          </p>
        </div>
      </div>

      {/* AI Ask */}
      <AskAI onNavigateToTopic={handleTopicClick} />

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
            !selectedCategory
              ? "bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30"
              : "bg-[#111111] text-[#A3A3A3] border-[#1A1A1A] hover:text-white hover:border-[#333]"
          )}
        >
          All Topics
        </button>
        {KNOWLEDGE_CATEGORIES.map((cat) => {
          const CatIcon = CATEGORY_ICON_MAP[cat.icon] || Briefcase;
          return (
            <button
              key={cat.id}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.id ? null : cat.id
                )
              }
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                selectedCategory === cat.id
                  ? "bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30"
                  : "bg-[#111111] text-[#A3A3A3] border-[#1A1A1A] hover:text-white hover:border-[#333]"
              )}
            >
              <CatIcon className="size-3" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
        <Input
          placeholder="Search topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#111111] border-[#1A1A1A] text-white placeholder:text-[#555]"
        />
      </div>

      {/* Topics Grid */}
      {filteredTopics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTopics.map((topic, i) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              index={i}
              onClick={handleTopicClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="size-8 mx-auto mb-3 text-[#333]" />
          <p className="text-white font-medium">No topics found</p>
          <p className="text-sm text-[#666] mt-1">
            Try a different search term or category
          </p>
        </div>
      )}

      {/* Category descriptions */}
      {!searchQuery && !selectedCategory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          {KNOWLEDGE_CATEGORIES.map((cat, i) => {
            const CatIcon = CATEGORY_ICON_MAP[cat.icon] || Briefcase;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-4 text-left hover:border-[#333] transition-all group"
              >
                <div
                  className="size-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center mb-3 animate-[fadeSlideIn_0.3s_ease_forwards] opacity-0"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <CatIcon className="size-4 text-[#A3A3A3] group-hover:text-[#DC2626] transition-colors" />
                </div>
                <h4 className="text-sm font-medium text-white group-hover:text-[#DC2626] transition-colors">
                  {cat.label}
                </h4>
                <p className="text-xs text-[#666] mt-0.5">{cat.description}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<LearnPageFallback />}>
      <LearnPageContent />
    </Suspense>
  );
}
