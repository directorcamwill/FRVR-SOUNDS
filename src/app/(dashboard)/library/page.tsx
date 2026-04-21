"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Archive,
  Check,
  ExternalLink,
  FileAudio,
  Library,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { SUPERVISORS, type Supervisor } from "@/lib/supervisors";

interface Submission {
  id: string;
  submitted_at: string;
  submitter_name: string;
  submitter_email: string;
  artist_name: string;
  song_title: string;
  proposed_deal_type: "rev_share" | "upfront_fee";
  genre: string | null;
  moods: string[] | null;
  bpm: number | null;
  key: string | null;
  is_one_stop: boolean;
  status: "pending" | "reviewing" | "accepted" | "rejected" | "signed";
  notes_from_artist: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  signed_audio_url?: string | null;
  song_file_path?: string | null;
  vocal_type?: string | null;
  lyrics?: string | null;
  sync_history?: string | null;
  instrumental_available?: boolean | null;
}

interface Deal {
  id: string;
  submission_id: string | null;
  song_title: string;
  artist_name: string;
  deal_type: "rev_share" | "upfront_fee";
  artist_split_pct: number;
  frvr_split_pct: number;
  upfront_fee_cents: number | null;
  upfront_fee_status: string | null;
  term_months: number;
  starts_at: string | null;
  ends_at: string | null;
  status: "pending_signature" | "active" | "expired" | "terminated";
  genre: string | null;
  moods: string[] | null;
  bpm: number | null;
  key: string | null;
  vocal_type: string | null;
  is_one_stop: boolean | null;
  song_file_path: string | null;
  created_at: string;
  library_pitches?: Array<{ id: string; status: string; sent_at: string; target_name: string }>;
}

interface Pitch {
  id: string;
  deal_id: string;
  target_kind: "supervisor_directory" | "pitch_target";
  target_ref: string;
  target_name: string;
  target_company: string | null;
  pitch_slug: string;
  status: "sent" | "opened" | "interested" | "passed" | "placed";
  sent_at: string;
  opened_at: string | null;
  view_count: number;
  notes: string | null;
  follow_up_date: string | null;
}

interface PitchTarget {
  id: string;
  name: string;
  target_type: string;
  company: string | null;
  contact_path: string | null;
  notes: string | null;
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  reviewing: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  signed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  pending_signature: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  expired: "bg-[#1A1A1A] text-[#666] border-[#333]",
  terminated: "bg-red-500/10 text-red-400 border-red-500/30",
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  opened: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  interested: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  passed: "bg-[#1A1A1A] text-[#666] border-[#333]",
  placed: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30",
};

export default function LibraryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [pitchTargets, setPitchTargets] = useState<PitchTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<Submission | null>(null);
  const [pitching, setPitching] = useState<Deal | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, p, t] = await Promise.all([
        fetch("/api/library/submissions").then((r) => r.json()),
        fetch("/api/library/deals").then((r) => r.json()),
        fetch("/api/library/pitches").then((r) => r.json()),
        fetch("/api/library/pitch-targets").then((r) => r.json()),
      ]);
      setSubmissions(s.submissions ?? []);
      setDeals(d.deals ?? []);
      setPitches(p.pitches ?? []);
      setPitchTargets(t.targets ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pendingCount = submissions.filter(
    (s) => s.status === "pending" || s.status === "reviewing"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#DC2626]/10 p-2 border border-[#DC2626]/30">
          <Library className="size-5 text-[#DC2626]" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">FRVR Sounds Library</h1>
          <p className="text-sm text-[#A3A3A3] max-w-2xl mt-1">
            Intake (artist submissions → review) + outreach (catalog songs → pitches to supervisors + studios). Public submission form at{" "}
            <Link
              href="/submit"
              target="_blank"
              className="text-[#DC2626] hover:text-red-300"
            >
              /submit
            </Link>
            .
          </p>
        </div>
        <Link
          href="/submit"
          target="_blank"
          className="shrink-0 text-xs text-[#DC2626] hover:text-red-300 inline-flex items-center gap-1"
        >
          Open public form <ExternalLink className="size-3" />
        </Link>
      </div>

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">
            Submissions{" "}
            {pendingCount > 0 && (
              <span className="ml-1.5 text-[10px] text-[#DC2626]">
                ({pendingCount})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="catalog">
            Catalog{" "}
            <span className="ml-1.5 text-[10px] text-[#666]">
              ({deals.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="pitches">
            Pitches{" "}
            <span className="ml-1.5 text-[10px] text-[#666]">
              ({pitches.length})
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTab
            submissions={submissions}
            loading={loading}
            onReview={setReviewing}
          />
        </TabsContent>
        <TabsContent value="catalog" className="mt-4">
          <CatalogTab
            deals={deals}
            loading={loading}
            onPitch={setPitching}
          />
        </TabsContent>
        <TabsContent value="pitches" className="mt-4">
          <PitchesTab pitches={pitches} deals={deals} loading={loading} onChange={refresh} />
        </TabsContent>
      </Tabs>

      <SubmissionReviewDialog
        submission={reviewing}
        onClose={() => setReviewing(null)}
        onDone={() => {
          setReviewing(null);
          refresh();
        }}
      />

      <PitchComposerDialog
        deal={pitching}
        pitchTargets={pitchTargets}
        onClose={() => setPitching(null)}
        onDone={() => {
          setPitching(null);
          refresh();
        }}
      />
    </div>
  );
}

function SubmissionsTab({
  submissions,
  loading,
  onReview,
}: {
  submissions: Submission[];
  loading: boolean;
  onReview: (s: Submission) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }
  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Archive className="size-8 text-[#333] mx-auto mb-2" />
          <p className="text-sm text-[#A3A3A3]">
            No submissions yet. Share your submission link:{" "}
            <Link
              href="/submit"
              target="_blank"
              className="text-[#DC2626] hover:text-red-300"
            >
              /submit
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {submissions.map((s) => (
        <button
          key={s.id}
          onClick={() => onReview(s)}
          className="text-left"
        >
          <Card className="hover:border-[#DC2626]/40 transition-colors h-full cursor-pointer">
            <CardContent className="py-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {s.song_title}
                  </p>
                  <p className="text-[11px] text-[#A3A3A3] truncate">
                    {s.artist_name} · {s.submitter_email}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[9px] capitalize ${statusStyles[s.status]}`}
                >
                  {s.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant="outline"
                  className="text-[9px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
                >
                  {s.proposed_deal_type === "rev_share"
                    ? "Rev-Share"
                    : "Upfront $99"}
                </Badge>
                {s.genre && (
                  <Badge variant="outline" className="text-[9px] bg-[#111]">
                    {s.genre}
                  </Badge>
                )}
                {s.bpm && (
                  <Badge variant="outline" className="text-[9px] bg-[#111]">
                    {s.bpm} BPM
                  </Badge>
                )}
                {s.is_one_stop && (
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  >
                    One-Stop
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-[#666]">
                {new Date(s.submitted_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}

function CatalogTab({
  deals,
  loading,
  onPitch,
}: {
  deals: Deal[];
  loading: boolean;
  onPitch: (d: Deal) => void;
}) {
  if (loading) return <Skeleton className="h-32" />;
  if (deals.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileAudio className="size-8 text-[#333] mx-auto mb-2" />
          <p className="text-sm text-[#A3A3A3]">
            No catalog deals yet. Accept a submission to create one.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {deals.map((d) => (
        <Card
          key={d.id}
          className="hover:border-[#DC2626]/40 transition-colors"
        >
          <CardContent className="py-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {d.song_title}
                </p>
                <p className="text-[11px] text-[#A3A3A3] truncate">
                  {d.artist_name}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`text-[9px] capitalize ${statusStyles[d.status]}`}
              >
                {d.status.replace("_", " ")}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1">
              <Badge
                variant="outline"
                className="text-[9px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
              >
                {d.deal_type === "rev_share" ? "Rev-Share" : "Upfront $99"}
              </Badge>
              <Badge variant="outline" className="text-[9px] bg-[#111]">
                {d.artist_split_pct}/{d.frvr_split_pct} split
              </Badge>
              <Badge variant="outline" className="text-[9px] bg-[#111]">
                {d.term_months}mo
              </Badge>
              {d.is_one_stop && (
                <Badge
                  variant="outline"
                  className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                >
                  One-Stop
                </Badge>
              )}
            </div>

            <div className="text-[11px] text-[#A3A3A3]">
              {d.library_pitches?.length ?? 0} pitch
              {(d.library_pitches?.length ?? 0) === 1 ? "" : "es"} sent
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={() => onPitch(d)}
            >
              <Send className="size-3.5 mr-1.5" />
              Pitch this song
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PitchesTab({
  pitches,
  deals,
  loading,
  onChange,
}: {
  pitches: Pitch[];
  deals: Deal[];
  loading: boolean;
  onChange: () => void;
}) {
  const dealTitleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of deals) m.set(d.id, `${d.song_title} — ${d.artist_name}`);
    return m;
  }, [deals]);

  const updateStatus = async (id: string, status: Pitch["status"]) => {
    try {
      const res = await fetch(`/api/library/pitches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Status → ${status}`);
      onChange();
    } catch {
      toast.error("Status update failed");
    }
  };

  if (loading) return <Skeleton className="h-32" />;
  if (pitches.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Send className="size-8 text-[#333] mx-auto mb-2" />
          <p className="text-sm text-[#A3A3A3]">
            No pitches sent yet. Open a catalog song and hit &quot;Pitch this
            song&quot;.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {pitches.map((p) => (
        <Card key={p.id}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {p.target_name}
                  {p.target_company && (
                    <span className="text-[#A3A3A3] font-normal">
                      {" "}
                      · {p.target_company}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-[#A3A3A3] truncate">
                  {dealTitleById.get(p.deal_id) ?? "Unknown song"}
                </p>
                <p className="text-[10px] text-[#555]">
                  Sent {new Date(p.sent_at).toLocaleDateString()} ·{" "}
                  {p.view_count} view{p.view_count === 1 ? "" : "s"}
                  {p.opened_at
                    ? ` · opened ${new Date(p.opened_at).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-[9px] capitalize ${statusStyles[p.status]}`}
                >
                  {p.status}
                </Badge>
                <Link
                  href={`/brief/${p.pitch_slug}`}
                  target="_blank"
                  className="text-[10px] uppercase tracking-wider text-[#DC2626] hover:text-red-300 border border-[#1A1A1A] bg-[#111] px-2 py-1 rounded"
                >
                  Open brief
                </Link>
                <select
                  value={p.status}
                  onChange={(e) =>
                    updateStatus(p.id, e.target.value as Pitch["status"])
                  }
                  className="text-[10px] bg-[#111] border border-[#1A1A1A] rounded px-1.5 py-1 text-white focus:outline-none"
                >
                  <option value="sent">Sent</option>
                  <option value="opened">Opened</option>
                  <option value="interested">Interested</option>
                  <option value="passed">Passed</option>
                  <option value="placed">Placed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SubmissionReviewDialog({
  submission,
  onClose,
  onDone,
}: {
  submission: Submission | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNotes(submission?.review_notes ?? "");
    setRejectionReason(submission?.rejection_reason ?? "");
  }, [submission?.id, submission?.review_notes, submission?.rejection_reason]);

  if (!submission) return null;

  const decide = async (decision: "accepted" | "rejected") => {
    if (!submission) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        status: decision,
        review_notes: notes,
      };
      if (decision === "rejected") body.rejection_reason = rejectionReason;
      if (decision === "accepted") {
        const isRev = submission.proposed_deal_type === "rev_share";
        body.deal = {
          deal_type: submission.proposed_deal_type,
          artist_split_pct: isRev ? 60 : 80,
          frvr_split_pct: isRev ? 40 : 20,
          term_months: isRev ? 24 : 12,
          upfront_fee_cents: isRev ? null : 9900,
        };
      }
      const res = await fetch(`/api/library/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Decision failed");
      toast.success(`Submission ${decision}`);
      onDone();
    } catch {
      toast.error("Could not update submission");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!submission} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{submission.song_title}</DialogTitle>
          <DialogDescription>
            {submission.artist_name} · Submitted by {submission.submitter_name}{" "}
            ({submission.submitter_email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-1">
            <Badge
              variant="outline"
              className={`text-[10px] capitalize ${statusStyles[submission.status]}`}
            >
              {submission.status}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
            >
              Proposed:{" "}
              {submission.proposed_deal_type === "rev_share"
                ? "Rev-Share"
                : "Upfront $99"}
            </Badge>
            {submission.genre && (
              <Badge variant="outline" className="text-[10px] bg-[#111]">
                {submission.genre}
              </Badge>
            )}
            {submission.bpm && (
              <Badge variant="outline" className="text-[10px] bg-[#111]">
                {submission.bpm} BPM
              </Badge>
            )}
            {submission.key && (
              <Badge variant="outline" className="text-[10px] bg-[#111]">
                {submission.key}
              </Badge>
            )}
            {submission.is_one_stop && (
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              >
                One-Stop
              </Badge>
            )}
          </div>

          {submission.moods && submission.moods.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                Moods
              </p>
              <div className="flex flex-wrap gap-1">
                {submission.moods.map((m) => (
                  <Badge
                    key={m}
                    variant="outline"
                    className="text-[10px] bg-[#111] capitalize"
                  >
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {submission.signed_audio_url && (
            <audio
              controls
              className="w-full"
              src={submission.signed_audio_url}
            />
          )}

          {submission.notes_from_artist && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                Notes from artist
              </p>
              <p className="text-sm text-[#D4D4D4] whitespace-pre-line leading-relaxed">
                {submission.notes_from_artist}
              </p>
            </div>
          )}

          {submission.sync_history && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                Sync history
              </p>
              <p className="text-sm text-[#D4D4D4] leading-relaxed">
                {submission.sync_history}
              </p>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
              Review notes (internal)
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none"
            />
          </div>

          {submission.status === "rejected" && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                Rejection reason (shared with artist)
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            size="sm"
            variant="outline"
            onClick={() => decide("rejected")}
            disabled={busy}
          >
            <X className="size-3.5 mr-1.5" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={() => decide("accepted")}
            disabled={busy}
          >
            <Check className="size-3.5 mr-1.5" />
            Accept & create deal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PitchComposerDialog({
  deal,
  pitchTargets,
  onClose,
  onDone,
}: {
  deal: Deal | null;
  pitchTargets: PitchTarget[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [selectedSupervisors, setSelectedSupervisors] = useState<Set<string>>(
    new Set()
  );
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const suggested: Supervisor[] = useMemo(() => {
    if (!deal) return [];
    const dealGenre = (deal.genre ?? "").toLowerCase();
    const dealMoods = (deal.moods ?? []).map((m) => m.toLowerCase());
    return [...SUPERVISORS]
      .map((s) => {
        let score = 0;
        const sg = s.genres.map((g) => g.toLowerCase());
        if (dealGenre && sg.includes(dealGenre)) score += 30;
        const sharedMoods = (s.mood_preferences ?? [])
          .map((m) => m.toLowerCase())
          .filter((m) => dealMoods.includes(m)).length;
        score += sharedMoods * 5;
        return { s, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((r) => r.s);
  }, [deal]);

  useEffect(() => {
    setSelectedSupervisors(new Set());
    setSelectedTargets(new Set());
  }, [deal?.id]);

  if (!deal) return null;

  const send = async () => {
    if (selectedSupervisors.size === 0 && selectedTargets.size === 0) {
      toast.error("Pick at least one target");
      return;
    }
    setBusy(true);
    try {
      const targets = [
        ...Array.from(selectedSupervisors).map((id) => {
          const sup = SUPERVISORS.find((s) => s.id === id);
          return {
            target_kind: "supervisor_directory" as const,
            target_ref: id,
            target_name: sup?.name ?? id,
            target_company: sup?.company ?? null,
          };
        }),
        ...Array.from(selectedTargets).map((id) => {
          const t = pitchTargets.find((x) => x.id === id);
          return {
            target_kind: "pitch_target" as const,
            target_ref: id,
            target_name: t?.name ?? id,
            target_company: t?.company ?? null,
          };
        }),
      ];
      const res = await fetch("/api/library/pitches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: deal.id, targets }),
      });
      if (!res.ok) throw new Error("Pitch send failed");
      toast.success(`${targets.length} pitch${targets.length === 1 ? "" : "es"} created`);
      onDone();
    } catch {
      toast.error("Could not create pitches");
    } finally {
      setBusy(false);
    }
  };

  const toggleSup = (id: string) => {
    setSelectedSupervisors((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const toggleTarget = (id: string) => {
    setSelectedTargets((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <Dialog open={!!deal} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pitch {deal.song_title}</DialogTitle>
          <DialogDescription>
            Generates a unique brief link per target. Each link tracks opens +
            views independently.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#666] mb-2">
              Suggested music supervisors (top 10 by match)
            </p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {suggested.map((s) => (
                <label
                  key={s.id}
                  className="flex items-start gap-2 rounded border border-[#1A1A1A] bg-[#0B0B0B] p-2 cursor-pointer hover:border-[#DC2626]/40"
                >
                  <input
                    type="checkbox"
                    checked={selectedSupervisors.has(s.id)}
                    onChange={() => toggleSup(s.id)}
                    className="mt-0.5 size-4 accent-[#DC2626]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-[#A3A3A3] truncate">
                      {s.formats.join(" · ")} · {s.genres.slice(0, 3).join(", ")}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {pitchTargets.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#666] mb-2">
                Your custom targets
              </p>
              <div className="space-y-1.5">
                {pitchTargets.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-start gap-2 rounded border border-[#1A1A1A] bg-[#0B0B0B] p-2 cursor-pointer hover:border-[#DC2626]/40"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTargets.has(t.id)}
                      onChange={() => toggleTarget(t.id)}
                      className="mt-0.5 size-4 accent-[#DC2626]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">
                        {t.name}
                      </p>
                      <p className="text-[11px] text-[#A3A3A3]">
                        {t.target_type.replace(/_/g, " ")}
                        {t.company ? ` · ${t.company}` : ""}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/library/targets"
            target="_blank"
            className="text-[11px] text-[#DC2626] hover:text-red-300 inline-flex items-center gap-1"
          >
            Add a custom target (studio / music department / ad agency)
            <ExternalLink className="size-3" />
          </Link>
        </div>

        <DialogFooter>
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={send} disabled={busy}>
            <Send className="size-3.5 mr-1.5" />
            Create{" "}
            {selectedSupervisors.size + selectedTargets.size || ""} pitch
            {selectedSupervisors.size + selectedTargets.size === 1 ? "" : "es"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
