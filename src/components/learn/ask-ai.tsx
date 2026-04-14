"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircleQuestion,
  Send,
  Loader2,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { KNOWLEDGE_TOPICS } from "@/lib/knowledge/topics";
import { ICON_MAP, CATEGORY_ICON_BG, CATEGORY_ICON_COLOR } from "./topic-card";
import { FileText } from "lucide-react";

interface AskResponse {
  answer: string;
  key_takeaways: string[];
  related_topics: string[];
  action_items: string[];
}

interface AskAIProps {
  onNavigateToTopic: (topicId: string) => void;
}

const SUGGESTED_QUESTIONS = [
  "How do I start collecting all my royalties?",
  "Should I sign an exclusive sync deal?",
  "What's the difference between a PRO and a publisher?",
  "How do I protect my music from being stolen?",
];

export function AskAI({ onNavigateToTopic }: AskAIProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(q?: string) {
    const queryText = q || question;
    if (!queryText.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/knowledge/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: queryText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get answer");
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestionClick(q: string) {
    setQuestion(q);
    handleSubmit(q);
  }

  const relatedTopics = (response?.related_topics || [])
    .map((id) => KNOWLEDGE_TOPICS.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Ask input */}
      <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-8 rounded-lg bg-[#DC2626]/15 flex items-center justify-center">
            <MessageCircleQuestion className="size-4 text-[#DC2626]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Ask a Music Business Question
            </h3>
            <p className="text-xs text-[#A3A3A3]">
              Get personalized answers powered by AI
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex gap-2"
        >
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about the music business..."
            className="bg-black border-[#1A1A1A] text-white placeholder:text-[#555] flex-1"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !question.trim()}
            className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white px-4"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>

        {/* Suggested questions */}
        {!response && !loading && (
          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSuggestionClick(q)}
                className="text-xs px-3 py-1.5 rounded-full bg-[#1A1A1A] text-[#A3A3A3] hover:text-white hover:bg-[#222] transition-colors border border-[#1A1A1A]"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-8 text-center">
          <Loader2 className="size-8 text-[#DC2626] animate-spin mx-auto mb-3" />
          <p className="text-sm text-white font-medium">
            Thinking through your question...
          </p>
          <p className="text-xs text-[#A3A3A3] mt-1">
            Getting personalized music business advice
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="space-y-4">
          {/* Answer */}
          <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-[#DC2626]" />
              <h3 className="text-sm font-semibold text-white">Answer</h3>
            </div>
            <div className="text-sm text-[#CCCCCC] leading-relaxed whitespace-pre-line">
              {response.answer}
            </div>
          </div>

          {/* Key takeaways */}
          {response.key_takeaways.length > 0 && (
            <div className="bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="size-4 text-[#DC2626]" />
                <h3 className="text-sm font-semibold text-[#DC2626]">
                  Key Takeaways
                </h3>
              </div>
              <ul className="space-y-2">
                {response.key_takeaways.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 animate-[fadeSlideIn_0.3s_ease_forwards] opacity-0"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <CheckCircle2 className="size-4 text-[#DC2626] shrink-0 mt-0.5" />
                    <span className="text-sm text-[#CCCCCC]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action items */}
          {response.action_items.length > 0 && (
            <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-400">
                  Action Items
                </h3>
              </div>
              <ul className="space-y-2">
                {response.action_items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 animate-[fadeSlideIn_0.3s_ease_forwards] opacity-0"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <span className="size-5 rounded-full bg-emerald-400/15 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[#CCCCCC]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related topics */}
          {relatedTopics.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
                Related Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {relatedTopics.map((topic) => {
                  if (!topic) return null;
                  const RelIcon = ICON_MAP[topic.icon] || FileText;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => onNavigateToTopic(topic.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg",
                        "bg-[#111111] border border-[#1A1A1A]",
                        "hover:border-[#333] hover:bg-[#141414] transition-all",
                        "text-left group"
                      )}
                    >
                      <div
                        className={cn(
                          "size-6 rounded flex items-center justify-center shrink-0",
                          CATEGORY_ICON_BG[topic.category] || "bg-[#1A1A1A]"
                        )}
                      >
                        <RelIcon
                          className={cn(
                            "size-3",
                            CATEGORY_ICON_COLOR[topic.category] ||
                              "text-[#A3A3A3]"
                          )}
                        />
                      </div>
                      <span className="text-xs text-white group-hover:text-[#DC2626] transition-colors">
                        {topic.title}
                      </span>
                      <ChevronRight className="size-3 text-[#333] group-hover:text-[#DC2626] shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
