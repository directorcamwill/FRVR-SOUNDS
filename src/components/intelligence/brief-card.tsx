"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface BriefSection {
  heading: string;
  content: string;
}

interface Brief {
  id: string;
  title: string;
  summary: string;
  sections: BriefSection[];
  brief_type: string;
  created_at: string;
}

export function BriefCard({ brief }: { brief: Brief }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{brief.title}</CardTitle>
            <p className="text-xs text-[#555] mt-1">
              {format(new Date(brief.created_at), "MMM d, yyyy 'at' h:mm a")}
              {" "}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-[#1A1A1A] text-[#A3A3A3] ml-1">
                {brief.brief_type}
              </span>
            </p>
          </div>
          {expanded ? (
            <ChevronDown className="size-4 text-[#555] shrink-0 mt-1" />
          ) : (
            <ChevronRight className="size-4 text-[#555] shrink-0 mt-1" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[#A3A3A3] leading-relaxed">
          {brief.summary}
        </p>
        {expanded && brief.sections?.length > 0 && (
          <div className="mt-4 space-y-4 border-t border-[#1A1A1A] pt-4">
            {brief.sections.map((section, i) => (
              <div key={i}>
                <h4 className="text-sm font-medium text-white mb-1">
                  {section.heading}
                </h4>
                <p className="text-sm text-[#A3A3A3] leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
