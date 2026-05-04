"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GENRES, PRO_AFFILIATIONS, OPPORTUNITY_TYPES } from "@/lib/utils/constants";

const GOAL_OPTIONS = OPPORTUNITY_TYPES.filter(
  (t) => ["tv", "film", "commercial", "trailer", "video_game", "library"].includes(t)
);

const goalLabels: Record<string, string> = {
  tv: "TV Shows",
  film: "Film",
  commercial: "Commercials",
  trailer: "Trailers",
  video_game: "Video Games",
  library: "Music Libraries",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [artistName, setArtistName] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [proAffiliation, setProAffiliation] = useState("");

  // Step 2
  const [hasStems, setHasStems] = useState(false);
  const [hasEntity, setHasEntity] = useState(false);

  // Step 3
  const [goals, setGoals] = useState<string[]>([]);

  function toggleGenre(genre: string) {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }

  function toggleGoal(goal: string) {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  async function handleComplete() {
    setLoading(true);
    try {
      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist_name: artistName,
          genres: selectedGenres,
          pro_affiliation: proAffiliation,
          has_stems: hasStems,
          has_entity: hasEntity,
          goals,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create artist profile");
        setLoading(false);
        return;
      }

      // V2: new users land on 'incomplete' status — push them to /pricing to
      // start the 7-day-with-card trial. Pricing page handles ?welcome=1 to
      // show a contextual "Start your trial" headline.
      router.push("/pricing?welcome=1");
    } catch {
      toast.error("Something went wrong");
      setLoading(false);
    }
  }

  const progress = (step / 3) * 100;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Set up your profile</h1>
        <p className="text-sm text-[#A3A3A3] mt-1">
          Step {step} of 3
        </p>
        <Progress value={progress} className="mt-3" />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="artistName">Artist / Project Name</Label>
            <Input
              id="artistName"
              placeholder="Your artist name"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Genres (select all that apply)</Label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <Badge
                  key={genre}
                  variant={selectedGenres.includes(genre) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pro">PRO Affiliation</Label>
            <select
              id="pro"
              className="flex h-9 w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-1 text-sm text-white"
              value={proAffiliation}
              onChange={(e) => setProAffiliation(e.target.value)}
            >
              <option value="">Select PRO</option>
              {PRO_AFFILIATIONS.map((pro) => (
                <option key={pro} value={pro}>
                  {pro}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => setStep(2)}
              disabled={!artistName}
            >
              Continue
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleComplete}
              disabled={!artistName || loading}
            >
              {loading ? "Saving..." : "Save profile"}
            </Button>
          </div>
          {!artistName && (
            <p className="text-[11px] text-[#A3A3A3] text-center">
              Artist name is required to save.
            </p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Do you have stems available?</Label>
              <p className="text-xs text-[#A3A3A3]">
                Separated instrument tracks for your songs
              </p>
            </div>
            <Switch checked={hasStems} onCheckedChange={setHasStems} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Do you have a business entity?</Label>
              <p className="text-xs text-[#A3A3A3]">
                LLC, Corp, or publishing company
              </p>
            </div>
            <Switch checked={hasEntity} onCheckedChange={setHasEntity} />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full text-[#A3A3A3] hover:text-white"
            onClick={handleComplete}
            disabled={!artistName || loading}
          >
            {loading ? "Saving..." : "Save profile and finish later"}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>What are your sync goals?</Label>
            <p className="text-xs text-[#A3A3A3]">
              Select all that apply (optional)
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {GOAL_OPTIONS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={`rounded-md border px-3 py-2 text-sm text-left transition-colors ${
                    goals.includes(goal)
                      ? "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]"
                      : "border-[#1A1A1A] text-[#A3A3A3] hover:border-[#333] hover:text-white"
                  }`}
                >
                  {goalLabels[goal] || goal}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleComplete}
              disabled={loading || !artistName}
            >
              {loading ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
