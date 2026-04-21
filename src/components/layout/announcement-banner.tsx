"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, X } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: "info" | "feature" | "warning" | "maintenance";
  cta_label: string | null;
  cta_url: string | null;
  dismissible: boolean;
}

const severityBackground: Record<string, string> = {
  info: "bg-blue-500/10 border-blue-500/30 text-blue-100",
  feature: "bg-[#DC2626]/10 border-[#DC2626]/30 text-white",
  warning: "bg-amber-500/10 border-amber-500/30 text-amber-100",
  maintenance: "bg-red-500/20 border-red-500/40 text-red-100",
};

export function AnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements/active");
      if (res.ok) {
        const data = await res.json();
        setItems(data.announcements ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dismiss = async (id: string) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/announcements/${id}/dismiss`, { method: "POST" });
    } catch {
      // ignore
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {items.map((a) => (
        <div
          key={a.id}
          className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${severityBackground[a.severity]}`}
        >
          <Megaphone className="size-4 mt-0.5 shrink-0 opacity-80" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{a.title}</p>
            <p className="text-xs opacity-90 leading-relaxed mt-0.5">
              {a.body}
            </p>
            {a.cta_label && a.cta_url && (
              <Link
                href={a.cta_url}
                className="text-xs underline underline-offset-2 inline-block mt-1"
              >
                {a.cta_label} →
              </Link>
            )}
          </div>
          {a.dismissible && (
            <button
              onClick={() => dismiss(a.id)}
              className="text-current opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
