"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface KnowledgeLinkProps {
  topicId: string;
  label: string;
  className?: string;
}

export function KnowledgeLink({ topicId, label, className }: KnowledgeLinkProps) {
  return (
    <Link
      href={`/learn?topic=${topicId}`}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-[#DC2626]/80 hover:text-[#DC2626] transition-colors",
        className
      )}
    >
      <GraduationCap className="size-3.5" />
      <span>Learn: {label}</span>
    </Link>
  );
}
