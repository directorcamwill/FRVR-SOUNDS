"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { SUBMISSION_STATUSES } from "@/types/opportunity";
import type { Submission, SubmissionStatus } from "@/types/opportunity";
import type { Song } from "@/types/song";

interface SubmissionFormProps {
  submission?: Submission | null;
  onSuccess: () => void;
  trigger?: React.ReactElement;
}

export function SubmissionForm({
  submission,
  onSuccess,
  trigger,
}: SubmissionFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);

  const [songId, setSongId] = useState(submission?.song_id || "");
  const [submittedTo, setSubmittedTo] = useState(
    submission?.submitted_to || ""
  );
  const [submittedVia, setSubmittedVia] = useState(
    submission?.submitted_via || ""
  );
  const [deadline, setDeadline] = useState(
    submission?.deadline ? submission.deadline.split("T")[0] : ""
  );
  const [feeAmount, setFeeAmount] = useState(
    submission?.fee_amount?.toString() || ""
  );
  const [notes, setNotes] = useState(submission?.notes || "");
  const [status, setStatus] = useState<SubmissionStatus>(
    submission?.status || "submitted"
  );

  useEffect(() => {
    if (open) {
      fetch("/api/songs")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setSongs(data);
        })
        .catch(() => {});
    }
  }, [open]);

  const reset = () => {
    if (!submission) {
      setSongId("");
      setSubmittedTo("");
      setSubmittedVia("");
      setDeadline("");
      setFeeAmount("");
      setNotes("");
      setStatus("submitted");
    }
    setError(null);
    setSaving(false);
  };

  const handleSave = async () => {
    if (!submittedTo.trim()) {
      setError("Submitted To is required");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      song_id: songId || null,
      submitted_to: submittedTo.trim(),
      submitted_via: submittedVia.trim() || null,
      deadline: deadline || null,
      fee_amount: feeAmount ? parseFloat(feeAmount) : null,
      notes: notes.trim() || null,
      status,
    };

    try {
      const url = submission
        ? `/api/submissions/${submission.id}`
        : "/api/submissions";
      const method = submission ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save submission");
      }
      setOpen(false);
      reset();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) reset();
      }}
    >
      <DialogTrigger
        render={
          trigger || (
            <Button>
              <Plus className="size-4 mr-2" />
              Add Submission
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {submission ? "Edit Submission" : "New Submission"}
          </DialogTitle>
          <DialogDescription>
            {submission
              ? "Update submission details."
              : "Track a new sync licensing submission."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Song</Label>
            <Select value={songId} onValueChange={(val) => setSongId(val ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a song" />
              </SelectTrigger>
              <SelectContent>
                {songs
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-to">Submitted To *</Label>
            <Input
              id="sub-to"
              placeholder="e.g., Netflix Music Supervisor"
              value={submittedTo}
              onChange={(e) => setSubmittedTo(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-via">Submitted Via</Label>
            <Input
              id="sub-via"
              placeholder="e.g., Email, Music Gateway, Taxi"
              value={submittedVia}
              onChange={(e) => setSubmittedVia(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub-deadline">Deadline</Label>
              <Input
                id="sub-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-fee">Fee Amount</Label>
              <Input
                id="sub-fee"
                type="number"
                placeholder="0.00"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(val) => { if (val) setStatus(val as SubmissionStatus); }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBMISSION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-notes">Notes</Label>
            <Textarea
              id="sub-notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            className="w-full"
            disabled={!submittedTo.trim() || saving}
            onClick={handleSave}
          >
            {saving
              ? "Saving..."
              : submission
                ? "Update Submission"
                : "Create Submission"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
