"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

interface PitchTarget {
  id: string;
  name: string;
  target_type: string;
  company: string | null;
  contact_path: string | null;
  notes: string | null;
}

const TARGET_TYPES = [
  { value: "music_supervisor", label: "Music Supervisor (not in directory)" },
  { value: "music_department", label: "Music Department" },
  { value: "studio", label: "Studio" },
  { value: "ad_agency", label: "Ad Agency" },
  { value: "network", label: "Network" },
  { value: "library_broker", label: "Library / Broker" },
  { value: "game_studio", label: "Game Studio" },
  { value: "other", label: "Other" },
];

export default function TargetsPage() {
  const [targets, setTargets] = useState<PitchTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [targetType, setTargetType] = useState("music_department");
  const [company, setCompany] = useState("");
  const [contactPath, setContactPath] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/library/pitch-targets");
      const data = await res.json();
      setTargets(data.targets ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async () => {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/library/pitch-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          target_type: targetType,
          company: company || null,
          contact_path: contactPath || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Target added");
      setName("");
      setCompany("");
      setContactPath("");
      setNotes("");
      refresh();
    } catch {
      toast.error("Could not add target");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/library"
          className="text-[#A3A3A3] hover:text-white"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Pitch Targets</h1>
          <p className="text-sm text-[#A3A3A3]">
            Studios, music departments, ad agencies, and other companies you
            pitch to. The Supervisor Directory is separate — these are for
            targets not in the curated supervisor list.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="py-4 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-[#666]">
            Add new target
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Netflix Music Department"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]/50"
              >
                {TARGET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactPath">Contact path</Label>
              <Input
                id="contactPath"
                value={contactPath}
                onChange={(e) => setContactPath(e.target.value)}
                placeholder="Submission portal URL, public page, etc."
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={create} disabled={busy}>
              <Plus className="size-3.5 mr-1.5" />
              Add target
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#666] mb-2">
          {targets.length} target{targets.length === 1 ? "" : "s"}
        </p>
        {loading ? (
          <p className="text-sm text-[#A3A3A3]">Loading…</p>
        ) : targets.length === 0 ? (
          <p className="text-sm text-[#A3A3A3]">
            No custom targets yet. Add one above.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {targets.map((t) => (
              <Card key={t.id}>
                <CardContent className="py-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {t.name}
                    </p>
                    <Badge variant="outline" className="text-[9px] bg-[#111]">
                      {t.target_type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  {t.company && (
                    <p className="text-[11px] text-[#A3A3A3]">{t.company}</p>
                  )}
                  {t.contact_path && (
                    <Link
                      href={
                        t.contact_path.startsWith("http")
                          ? t.contact_path
                          : `https://${t.contact_path}`
                      }
                      target="_blank"
                      className="text-[11px] text-[#DC2626] hover:text-red-300 break-all"
                    >
                      {t.contact_path}
                    </Link>
                  )}
                  {t.notes && (
                    <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
                      {t.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
