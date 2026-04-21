"use client";

import { useCallback, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { CheckCircle2, Upload, Music, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED_EXTENSIONS = ".mp3,.wav,.flac,.aif,.aiff";

export default function SubmitToLibraryPage() {
  const [step, setStep] = useState<"form" | "uploading" | "done">("form");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterPhone, setSubmitterPhone] = useState("");
  const [artistName, setArtistName] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [proposedDealType, setProposedDealType] =
    useState<"rev_share" | "upfront_fee">("rev_share");
  const [genre, setGenre] = useState("");
  const [subGenre, setSubGenre] = useState("");
  const [moods, setMoods] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [vocalType, setVocalType] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [syncHistory, setSyncHistory] = useState("");
  const [isOneStop, setIsOneStop] = useState(false);
  const [instrumentalAvailable, setInstrumentalAvailable] = useState(false);
  const [notes, setNotes] = useState("");
  const [attestation, setAttestation] = useState(false);

  const handleFile = (f: File) => {
    if (
      !f.name.match(/\.(mp3|wav|flac|aif|aiff)$/i) ||
      f.size > 100 * 1024 * 1024
    ) {
      setError("Please upload an MP3, WAV, FLAC, or AIF under 100MB.");
      return;
    }
    setFile(f);
    setError(null);
    if (!songTitle) {
      setSongTitle(f.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    },
    [songTitle]
  );

  const submit = async () => {
    setError(null);
    if (!submitterName || !submitterEmail) {
      setError("Your name and email are required.");
      return;
    }
    if (!artistName || !songTitle) {
      setError("Artist name and song title are required.");
      return;
    }
    if (!file) {
      setError("Please upload your song file.");
      return;
    }
    if (!attestation) {
      setError(
        "You must confirm you own or control the rights to this song before submitting."
      );
      return;
    }

    setStep("uploading");
    setProgress(10);

    try {
      // Create a pseudo-submission id client-side so the upload path is scoped;
      // the server accepts it into the submission row.
      const submissionId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // 1. Get signed upload URL + token from server
      const urlRes = await fetch("/api/library/submit/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          submissionId,
        }),
      });
      if (!urlRes.ok) throw new Error("Could not get upload URL");
      const { path, token } = await urlRes.json();
      setProgress(30);

      // 2. Upload via the Supabase SDK — handles auth headers the storage
      // service expects. Raw PUT to the signed URL fails auth.
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("audio-files")
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type || "audio/mpeg",
        });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      setProgress(75);

      // 3. Create submission record
      const submitRes = await fetch("/api/library/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitter_name: submitterName,
          submitter_email: submitterEmail,
          submitter_phone: submitterPhone,
          artist_name: artistName,
          song_title: songTitle,
          proposed_deal_type: proposedDealType,
          song_file_path: path,
          genre,
          sub_genre: subGenre,
          moods: moods
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          bpm: bpm ? parseInt(bpm, 10) : null,
          key,
          vocal_type: vocalType,
          lyrics,
          sync_history: syncHistory,
          is_one_stop: isOneStop,
          instrumental_available: instrumentalAvailable,
          notes_from_artist: notes,
          attestation_owns_rights: true,
        }),
      });
      const data = await submitRes.json();
      if (!submitRes.ok) throw new Error(data?.error || "Submission failed");
      setProgress(100);
      setSubmissionId(data.id);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setStep("form");
    }
  };

  if (step === "done") {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardContent className="py-8 text-center space-y-4">
            <div className="mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 p-3 w-fit">
              <CheckCircle2 className="size-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Submission received</h1>
            <p className="text-sm text-[#A3A3A3] leading-relaxed">
              Thanks — we received <strong className="text-white">{songTitle}</strong>{" "}
              by <strong className="text-white">{artistName}</strong>. The FRVR
              Sounds team reviews submissions within 7–14 days. We&apos;ll reach
              out at <strong className="text-white">{submitterEmail}</strong>{" "}
              with a decision.
            </p>
            <p className="text-[11px] text-[#666]">Ref: {submissionId}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black py-10">
      <div className="max-w-2xl mx-auto px-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-[0.2em] text-[#DC2626]">
              FRVR SOUNDS
            </span>
            <span className="text-xs uppercase tracking-wider text-[#666]">
              Music Library
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white">Submit your song</h1>
          <p className="text-sm text-[#A3A3A3] leading-relaxed">
            FRVR Sounds represents original music for sync placement in film, TV,
            trailers, ads, and games. Pick a deal track, upload your song, and we&apos;ll
            review within 7–14 days.
          </p>
        </div>

        {/* Deal track selector */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-[#666]">
              Choose your submission track
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setProposedDealType("rev_share")}
                className={cn(
                  "text-left rounded-lg border p-3 transition-colors",
                  proposedDealType === "rev_share"
                    ? "border-[#DC2626] bg-[#DC2626]/10"
                    : "border-[#1A1A1A] hover:border-[#333]"
                )}
              >
                <p className="text-sm font-semibold text-white">Rev-Share</p>
                <p className="text-[11px] text-[#A3A3A3] mt-1 leading-relaxed">
                  No upfront cost. Artist keeps 60% of sync fees + 100% of
                  non-sync revenue. Exclusive sync rep for 24 months.
                </p>
              </button>
              <button
                onClick={() => setProposedDealType("upfront_fee")}
                className={cn(
                  "text-left rounded-lg border p-3 transition-colors",
                  proposedDealType === "upfront_fee"
                    ? "border-[#DC2626] bg-[#DC2626]/10"
                    : "border-[#1A1A1A] hover:border-[#333]"
                )}
              >
                <p className="text-sm font-semibold text-white">
                  Upfront Fee · $99
                </p>
                <p className="text-[11px] text-[#A3A3A3] mt-1 leading-relaxed">
                  Non-exclusive for 12 months. Artist keeps 80% of sync fees.
                  Fastest path to catalog placement.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 space-y-4">
            <p className="text-[10px] uppercase tracking-wider text-[#666]">
              Your info
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="submitterName">Your name *</Label>
                <Input
                  id="submitterName"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="submitterEmail">Email *</Label>
                <Input
                  id="submitterEmail"
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="submitterPhone">Phone (optional)</Label>
                <Input
                  id="submitterPhone"
                  value={submitterPhone}
                  onChange={(e) => setSubmitterPhone(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 space-y-4">
            <p className="text-[10px] uppercase tracking-wider text-[#666]">
              Song info
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="artistName">Artist name *</Label>
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="songTitle">Song title *</Label>
                <Input
                  id="songTitle"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. Indie Pop"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="subGenre">Sub-genre</Label>
                <Input
                  id="subGenre"
                  value={subGenre}
                  onChange={(e) => setSubGenre(e.target.value)}
                  placeholder="e.g. Bedroom Pop"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bpm">BPM</Label>
                <Input
                  id="bpm"
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g. Am"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="moods">Moods (comma-separated)</Label>
                <Input
                  id="moods"
                  value={moods}
                  onChange={(e) => setMoods(e.target.value)}
                  placeholder="melancholic, hopeful, atmospheric"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vocalType">Vocal type</Label>
                <Input
                  id="vocalType"
                  value={vocalType}
                  onChange={(e) => setVocalType(e.target.value)}
                  placeholder="female lead / male lead / duet / instrumental"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="syncHistory">Prior sync placements</Label>
                <Input
                  id="syncHistory"
                  value={syncHistory}
                  onChange={(e) => setSyncHistory(e.target.value)}
                  placeholder="Any prior TV/film use?"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label htmlFor="lyrics">Lyrics (optional — helps pitch)</Label>
                <textarea
                  id="lyrics"
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  rows={4}
                  className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="oneStop"
                  type="checkbox"
                  checked={isOneStop}
                  onChange={(e) => setIsOneStop(e.target.checked)}
                  className="size-4 accent-[#DC2626]"
                />
                <Label htmlFor="oneStop" className="text-xs">
                  One-stop (I control both master + publishing)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="instrumental"
                  type="checkbox"
                  checked={instrumentalAvailable}
                  onChange={(e) => setInstrumentalAvailable(e.target.checked)}
                  className="size-4 accent-[#DC2626]"
                />
                <Label htmlFor="instrumental" className="text-xs">
                  Instrumental version available
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-[#666]">
              Upload file *
            </p>
            <div
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
                dragActive
                  ? "border-[#DC2626] bg-[#DC2626]/5"
                  : file
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-[#333] hover:border-[#555]"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() =>
                step === "form" && fileInputRef.current?.click()
              }
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
              {file ? (
                <div className="flex items-center gap-3 text-sm">
                  <Music className="size-8 text-emerald-400" />
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-[#A3A3A3] text-xs">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  {step === "form" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-[#A3A3A3] hover:text-white"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <Upload className="size-8 text-[#555] mb-2" />
                  <p className="text-sm text-[#A3A3A3]">
                    Drag and drop your audio file
                  </p>
                  <p className="text-xs text-[#555] mt-1">
                    MP3, WAV, FLAC, AIF · up to 100MB
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#DC2626]/30">
          <CardContent className="py-4 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-[#DC2626] font-semibold flex items-center gap-1">
              <Shield className="size-3" />
              Rights attestation
            </p>
            <div className="flex items-start gap-2">
              <input
                id="attest"
                type="checkbox"
                checked={attestation}
                onChange={(e) => setAttestation(e.target.checked)}
                className="size-4 accent-[#DC2626] mt-0.5"
              />
              <Label htmlFor="attest" className="text-xs leading-relaxed">
                I confirm I own or control the rights to this song
                (master + composition) or have signed agreements from all
                co-writers, producers, and sample holders authorizing me to
                license it. I understand that false attestation voids any
                deal with FRVR Sounds and transfers liability to me.
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 space-y-2">
            <Label htmlFor="notes" className="text-xs">
              Notes (optional)
            </Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything else the FRVR team should know?"
              className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none"
            />
          </CardContent>
        </Card>

        {step === "uploading" && (
          <Progress value={progress}>
            <ProgressLabel>Uploading and submitting…</ProgressLabel>
            <ProgressValue />
          </Progress>
        )}

        {error && (
          <div className="rounded border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <Badge
            variant="outline"
            className="text-[10px] bg-[#111] capitalize"
          >
            {proposedDealType === "rev_share"
              ? "Rev-Share · 60/40 artist-favored · 24mo exclusive sync"
              : "Upfront · $99 · 12mo non-exclusive · 80% to artist"}
          </Badge>
          <Button onClick={submit} disabled={step === "uploading"}>
            {step === "uploading" ? "Submitting…" : "Submit to library"}
          </Button>
        </div>
      </div>
    </main>
  );
}
