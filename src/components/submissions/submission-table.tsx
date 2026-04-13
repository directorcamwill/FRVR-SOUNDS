"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SubmissionForm } from "./submission-form";
import { Send, Music, Calendar, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { Submission } from "@/types/opportunity";

interface SubmissionTableProps {
  submissions: Submission[];
  loading: boolean;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-500/20 text-blue-400",
  under_review: "bg-amber-500/20 text-amber-400",
  shortlisted: "bg-purple-500/20 text-purple-400",
  selected: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
  expired: "bg-[#333] text-[#A3A3A3]",
};

export function SubmissionTable({
  submissions,
  loading,
  onRefresh,
}: SubmissionTableProps) {
  const [sortBy, setSortBy] = useState<"date" | "deadline">("date");

  const sorted = [...submissions].sort((a, b) => {
    if (sortBy === "deadline") {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return (
      new Date(b.submission_date).getTime() -
      new Date(a.submission_date).getTime()
    );
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Send className="size-12 text-[#333] mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">
            No submissions yet
          </h3>
          <p className="text-sm text-[#A3A3A3]">
            Submissions will appear here once you start sending songs to
            opportunities.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        <Button
          variant={sortBy === "date" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("date")}
        >
          By Date
        </Button>
        <Button
          variant={sortBy === "deadline" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("deadline")}
        >
          By Deadline
        </Button>
      </div>

      {/* Table header */}
      <div className="hidden md:grid grid-cols-[1fr_1fr_100px_100px_90px_80px_40px] gap-3 px-4 py-2 text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
        <span>Song</span>
        <span>Submitted To</span>
        <span>Date</span>
        <span>Deadline</span>
        <span>Status</span>
        <span>Fee</span>
        <span></span>
      </div>

      {sorted.map((sub) => (
        <Card key={sub.id}>
          <CardContent className="p-4">
            <div className="md:grid md:grid-cols-[1fr_1fr_100px_100px_90px_80px_40px] md:gap-3 md:items-center space-y-2 md:space-y-0">
              <div className="flex items-center gap-2 min-w-0">
                <Music className="size-4 text-[#555] shrink-0" />
                <span className="text-sm text-white truncate">
                  {sub.song?.title || "No song"}
                </span>
              </div>

              <span className="text-sm text-[#A3A3A3] truncate">
                {sub.submitted_to}
              </span>

              <span className="text-xs text-[#A3A3A3]">
                {format(parseISO(sub.submission_date), "MMM d, yyyy")}
              </span>

              <span className="text-xs text-[#A3A3A3]">
                {sub.deadline
                  ? format(parseISO(sub.deadline), "MMM d, yyyy")
                  : "--"}
              </span>

              <Badge
                className={cn(
                  "text-[10px] border-0 w-fit",
                  STATUS_COLORS[sub.status] || STATUS_COLORS.submitted
                )}
              >
                {sub.status.replace("_", " ")}
              </Badge>

              <span className="text-sm text-white">
                {sub.fee_amount ? `$${sub.fee_amount.toLocaleString()}` : "--"}
              </span>

              <SubmissionForm
                submission={sub}
                onSuccess={onRefresh}
                trigger={
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Pencil className="size-3.5 text-[#A3A3A3]" />
                  </Button>
                }
              />
            </div>

            {sub.notes && (
              <p className="text-xs text-[#555] mt-2 pl-6">{sub.notes}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
