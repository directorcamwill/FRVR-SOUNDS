"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { CheckCircle2, Music, Shield, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED_EXTENSIONS = ".mp3,.wav,.flac,.aif,.aiff";

interface LibrarySubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Prefill fields when opened from a specific song/vault context.
  prefill?: {
    artist_name?: string;
    song_title?: string;
    genre?: string;
    sub_genre?: string;
    moods?: string[];
    bpm?: number | null;
    key?: string | null;
    vocal_type?: string | null;
    submitter_name?: string;
    submitter_email?: string;
  };
  onSubmitted?: (submissionId: string) => void;
}

export function LibrarySubmitDialog({
  open,
  onOpenChange,
  prefill,
  onSubmitted,
}: LibrarySubmitDialogProps) {
  const [step, setStep] = useState<"form" | "uploading" | "done">("form");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [artistName, setArtistName] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [proposedDealType, setProposedDealType] =
    useState<"rev_share" | "upfront_fee">("rev_share");
  const [genre, setGenre] = useState("");
  const [subGenre, setSubGenre] = useState("");
  const [moods, setMoods] = useState("");
  const [bpm, setBpm] = useState("");
  const [keyName, setKeyName] = useState("");
  const [vocalType, setVocalType] = useState("");
  const [isOneStop, setIsOneStop] = useState(false);
  const [instrumentalAvailable, setInstrumentalAvailable] = useState(false);
  const [notes, setNotes] = useState("");
  const [attestation, setAttestation] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (prefill?.artist_name) setArtistName(prefill.artist_name);
    if (prefill?.song_title) setSongTitle(prefill.song_title);
    if (prefill?.genre) setGenre(prefill.genre);
    if (prefill?.sub_genre) setSubGenre(prefill.sub_genre);
    if (prefill?.moods?.length) setMoods(prefill.moods.join(", "));
    if (prefill?.bpm) setBpm(String(prefill.bpm));
    if (prefill?.key) setKeyName(prefill.key);
    if (prefill?.vocal_type) setVocalType(prefill.vocal_type);
    if (prefill?.submitter_name) setSubmitterName(prefill.submitter_name);
    if (prefill?.submitter_email) setSubmitterEmail(prefill.submitter_email);
  }, [open, prefill]);

  // Autofill submitter identity from /api/me if not already provided.
  useEffect(() => {
    if (!open) return;
    if (submitterEmail && submitterName) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((j) => {
        if (!j?.authenticated) return;
        // `/api/me` doesn't return email directly; pull from supabase auth.
      })
      .catch(() => {});
  }, [open, submitterEmail, submitterName]);

  const reset = () => {
    setStep("form");
    setFile(null);
    setProgress(0);
    setError(null);
    setSubmissionId(null);
    setAttestation(false);
    setShowAdvanced(false);
  };

  const handleFile = (f: File) => {
    if (!f.name.match(/\.(mp3|wav|flac|aif|aiff)$/i) || f.size > 100 * 1024 * 1024) {
      setError("Please upload an MP3, WAV, FLAC, or AIF under 100MB.");
      return;
    }
    setFile(f);
    setError(null);
    if (!songTitle) setSongTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [songTitle],
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
      setError("You must confirm you own or control the rights to this song.");
      return;
    }

    setStep("uploading");
    setProgress(10);

    try {
      const newSubmissionId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const urlRes = await fetch("/api/library/submit/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, submissionId: newSubmissionId }),
      });
      if (!urlRes.ok) throw new Error("Could not get upload URL");
      const { path, token } = await urlRes.json();
      setProgress(30);

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("audio-files")
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type || "audio/mpeg",
        });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      setProgress(75);

      const submitRes = await fetch("/api/library/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitter_name: submitterName,
          submitter_email: submitterEmail,
          artist_name: artistName,
          song_title: songTitle,
          proposed_deal_type: proposedDealType,
          song_file_path: path,
          genre: genre || null,
          sub_genre: subGenre || null,
          moods: moods
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          bpm: bpm ? parseInt(bpm, 10) : null,
          key: keyName || null,
          vocal_type: vocalType || null,
          is_one_stop: isOneStop,
          instrumental_available: instrumentalAvailable,
          notes_from_artist: notes || null,
          attestation_owns_rights: true,
        }),
      });
      const data = await submitRes.json();
      if (!submitRes.ok) throw new Error(data?.error || "Submission failed");
      setProgress(100);
      setSubmissionId(data.id);
      setStep("done");
      onSubmitted?.(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setStep("form");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && step === "done") reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === "done" ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 p-3 w-fit">
              <CheckCircle2 className="size-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Submission received</h2>
            <p className="text-sm text-[#A3A3A3] leading-relaxed">
              We received <strong className="text-white">{songTitle}</strong> by{" "}
              <strong className="text-white">{artistName}</strong>. Reviews take
              7–14 days. You&apos;ll hear back at{" "}
              <strong className="text-white">{submitterEmail}</strong>.
            </p>
            <p className="text-[10px] text-[#555]">Ref: {submissionId}</p>
            <Button
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Submit to the FRVR Sounds Library</DialogTitle>
              <DialogDescription>
                Original music for sync placement in film, TV, trailers, ads, and
                games. Reviewed within 7–14 days.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Deal selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProposedDealType("rev_share")}
                  className={cn(
                    "text-left rounded-lg border p-3 transition-colors",
                    proposedDealType === "rev_share"
                      ? "border-[#DC2626] bg-[#DC2626]/10"
                      : "border-[#1A1A1A] hover:border-[#333]",
                  )}
                >
                  <p className="text-sm font-semibold text-white">Rev-Share</p>
                  <p className="text-[11px] text-[#A3A3A3] mt-1 leading-relaxed">
                    60% artist / 40% FRVR. No upfront. 24mo exclusive sync.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setProposedDealType("upfront_fee")}
                  className={cn(
                    "text-left rounded-lg border p-3 transition-colors",
                    proposedDealType === "upfront_fee"
                      ? "border-[#DC2626] bg-[#DC2626]/10"
                      : "border-[#1A1A1A] hover:border-[#333]",
                  )}
                >
                  <p className="text-sm font-semibold text-white">Upfront · $99</p>
                  <p className="text-[11px] text-[#A3A3A3] mt-1 leading-relaxed">
                    80% artist. 12mo non-exclusive. Fastest path to catalog.
                  </p>
                </button>
              </div>

              {/* Core fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="submit-name">Your name *</Label>
                  <Input
                    id="submit-name"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="submit-email">Email *</Label>
                  <Input
                    id="submit-email"
                    type="email"
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="submit-artist">Artist name *</Label>
                  <Input
                    id="submit-artist"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="submit-title">Song title *</Label>
                  <Input
                    id="submit-title"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                  />
                </div>
              </div>

              {/* File drop */}
              <div
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
                  dragActive
                    ? "border-[#DC2626] bg-[#DC2626]/5"
                    : file
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-[#333] hover:border-[#555]",
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                onClick={() => step === "form" && fileInputRef.current?.click()}
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
                    <Music className="size-7 text-emerald-400" />
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{file.name}</p>
                      <p className="text-[#A3A3A3] text-xs">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    {step === "form" && (
                      <button
                        type="button"
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
                    <Upload className="size-7 text-[#555] mb-2" />
                    <p className="text-sm text-[#A3A3A3]">
                      Drop your song, or click to choose
                    </p>
                    <p className="text-xs text-[#555] mt-1">
                      MP3 / WAV / FLAC / AIF · up to 100MB
                    </p>
                  </>
                )}
              </div>

              {/* Advanced fields */}
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-[11px] uppercase tracking-[0.3em] text-white/50 hover:text-white"
              >
                {showAdvanced ? "Hide" : "Add"} metadata (optional)
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="submit-genre">Genre</Label>
                    <Input
                      id="submit-genre"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      placeholder="e.g. R&B"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="submit-subgenre">Sub-genre</Label>
                    <Input
                      id="submit-subgenre"
                      value={subGenre}
                      onChange={(e) => setSubGenre(e.target.value)}
                      placeholder="e.g. Bedroom Soul"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="submit-bpm">BPM</Label>
                    <Input
                      id="submit-bpm"
                      type="number"
                      value={bpm}
                      onChange={(e) => setBpm(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="submit-key">Key</Label>
                    <Input
                      id="submit-key"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="e.g. Am"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="submit-moods">Moods (comma-separated)</Label>
                    <Input
                      id="submit-moods"
                      value={moods}
                      onChange={(e) => setMoods(e.target.value)}
                      placeholder="intimate, melancholic, cinematic"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="submit-vocal">Vocal type</Label>
                    <Input
                      id="submit-vocal"
                      value={vocalType}
                      onChange={(e) => setVocalType(e.target.value)}
                      placeholder="female lead / male lead / duet / instrumental"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="submit-onestop"
                      type="checkbox"
                      checked={isOneStop}
                      onChange={(e) => setIsOneStop(e.target.checked)}
                      className="size-4 accent-[#DC2626]"
                    />
                    <Label htmlFor="submit-onestop" className="text-xs">
                      One-stop (I control master + publishing)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="submit-instr"
                      type="checkbox"
                      checked={instrumentalAvailable}
                      onChange={(e) => setInstrumentalAvailable(e.target.checked)}
                      className="size-4 accent-[#DC2626]"
                    />
                    <Label htmlFor="submit-instr" className="text-xs">
                      Instrumental version available
                    </Label>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label htmlFor="submit-notes" className="text-xs">Notes</Label>
                    <textarea
                      id="submit-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Rights attestation */}
              <div className="rounded border border-[#DC2626]/30 bg-[#DC2626]/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#DC2626] font-semibold flex items-center gap-1 mb-2">
                  <Shield className="size-3" />
                  Rights attestation
                </p>
                <div className="flex items-start gap-2">
                  <input
                    id="submit-attest"
                    type="checkbox"
                    checked={attestation}
                    onChange={(e) => setAttestation(e.target.checked)}
                    className="size-4 accent-[#DC2626] mt-0.5"
                  />
                  <Label htmlFor="submit-attest" className="text-xs leading-relaxed">
                    I own or control the rights (master + publishing) or have
                    signed agreements from all co-writers/producers/sample
                    holders authorizing me to license this song.
                  </Label>
                </div>
              </div>

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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={step === "uploading"}
                >
                  Cancel
                </Button>
                <Button onClick={submit} disabled={step === "uploading"}>
                  {step === "uploading" ? "Submitting…" : "Submit to library"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
