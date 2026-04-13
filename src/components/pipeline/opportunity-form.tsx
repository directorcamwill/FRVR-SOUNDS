"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { OPPORTUNITY_TYPES } from "@/types/opportunity";
import type { Opportunity, OpportunityType } from "@/types/opportunity";

interface OpportunityFormProps {
  opportunity?: Opportunity | null;
  onSuccess: () => void;
  trigger?: React.ReactElement;
}

export function OpportunityForm({
  opportunity,
  onSuccess,
  trigger,
}: OpportunityFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(opportunity?.title || "");
  const [description, setDescription] = useState(
    opportunity?.description || ""
  );
  const [opportunityType, setOpportunityType] = useState<string>(
    opportunity?.opportunity_type || ""
  );
  const [company, setCompany] = useState(opportunity?.company || "");
  const [source, setSource] = useState(opportunity?.source || "");
  const [sourceUrl, setSourceUrl] = useState(opportunity?.source_url || "");
  const [genresNeeded, setGenresNeeded] = useState(
    opportunity?.genres_needed?.join(", ") || ""
  );
  const [moodsNeeded, setMoodsNeeded] = useState(
    opportunity?.moods_needed?.join(", ") || ""
  );
  const [budgetRange, setBudgetRange] = useState(
    opportunity?.budget_range || ""
  );
  const [deadline, setDeadline] = useState(
    opportunity?.deadline ? opportunity.deadline.split("T")[0] : ""
  );
  const [contactName, setContactName] = useState(
    opportunity?.contact_name || ""
  );
  const [contactEmail, setContactEmail] = useState(
    opportunity?.contact_email || ""
  );
  const [exclusive, setExclusive] = useState(opportunity?.exclusive ?? false);

  const reset = () => {
    if (!opportunity) {
      setTitle("");
      setDescription("");
      setOpportunityType("");
      setCompany("");
      setSource("");
      setSourceUrl("");
      setGenresNeeded("");
      setMoodsNeeded("");
      setBudgetRange("");
      setDeadline("");
      setContactName("");
      setContactEmail("");
      setExclusive(false);
    }
    setError(null);
    setSaving(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      opportunity_type: opportunityType || null,
      company: company.trim() || null,
      source: source.trim() || null,
      source_url: sourceUrl.trim() || null,
      genres_needed: genresNeeded
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      moods_needed: moodsNeeded
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      budget_range: budgetRange.trim() || null,
      deadline: deadline || null,
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      exclusive,
    };

    try {
      const url = opportunity
        ? `/api/opportunities/${opportunity.id}`
        : "/api/opportunities";
      const method = opportunity ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save opportunity");
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
              Add Opportunity
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {opportunity ? "Edit Opportunity" : "New Opportunity"}
          </DialogTitle>
          <DialogDescription>
            {opportunity
              ? "Update opportunity details."
              : "Add a new sync licensing opportunity to your pipeline."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="opp-title">Title *</Label>
            <Input
              id="opp-title"
              placeholder="e.g., Netflix Drama Scene"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opp-desc">Description</Label>
            <Textarea
              id="opp-desc"
              placeholder="Describe the opportunity brief..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Opportunity Type</Label>
              <Select
                value={opportunityType}
                onValueChange={(val) => setOpportunityType((val ?? "") as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {OPPORTUNITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-company">Company</Label>
              <Input
                id="opp-company"
                placeholder="e.g., Netflix"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opp-source">Source</Label>
              <Input
                id="opp-source"
                placeholder="e.g., Music Gateway"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-source-url">Source URL</Label>
              <Input
                id="opp-source-url"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opp-genres">Genres Needed</Label>
            <Input
              id="opp-genres"
              placeholder="e.g., Indie Rock, Electronic, Hip Hop"
              value={genresNeeded}
              onChange={(e) => setGenresNeeded(e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-[#A3A3A3]">Comma-separated</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opp-moods">Moods Needed</Label>
            <Input
              id="opp-moods"
              placeholder="e.g., Uplifting, Energetic, Hopeful"
              value={moodsNeeded}
              onChange={(e) => setMoodsNeeded(e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-[#A3A3A3]">Comma-separated</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opp-budget">Budget Range</Label>
              <Input
                id="opp-budget"
                placeholder="e.g., $500-$2000"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-deadline">Deadline</Label>
              <Input
                id="opp-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opp-contact-name">Contact Name</Label>
              <Input
                id="opp-contact-name"
                placeholder="Contact name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-contact-email">Contact Email</Label>
              <Input
                id="opp-contact-email"
                type="email"
                placeholder="email@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={exclusive}
              onCheckedChange={setExclusive}
              disabled={saving}
            />
            <Label>Exclusive Placement</Label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            className="w-full"
            disabled={!title.trim() || saving}
            onClick={handleSave}
          >
            {saving
              ? "Saving..."
              : opportunity
                ? "Update Opportunity"
                : "Create Opportunity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
