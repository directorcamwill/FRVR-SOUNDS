"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { GENRES, PRO_AFFILIATIONS } from "@/lib/utils/constants";
import { toast } from "sonner";

interface SettingsFormValues {
  artist_name: string;
  full_name: string;
  genres: string;
  moods: string;
  pro_affiliation: string;
  ipi_number: string;
}

const GOAL_OPTIONS = [
  { value: "tv", label: "TV Shows" },
  { value: "film", label: "Film" },
  { value: "commercial", label: "Commercials" },
  { value: "trailer", label: "Trailers" },
  { value: "video_game", label: "Video Games" },
  { value: "library", label: "Music Libraries" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { register, watch, setValue, getValues, reset } = useForm<SettingsFormValues>({
    defaultValues: {
      artist_name: "",
      full_name: "",
      genres: "",
      moods: "",
      pro_affiliation: "",
      ipi_number: "",
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setEmail(data.email || "");
          setGoals(data.goals || []);
          reset({
            artist_name: data.artist_name || "",
            full_name: data.full_name || "",
            genres: (data.genres || []).join(", "),
            moods: (data.moods || []).join(", "),
            pro_affiliation: data.pro_affiliation || "",
            ipi_number: data.ipi_number || "",
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [reset]);

  const save = useCallback(
    async (data: SettingsFormValues, currentGoals: string[]) => {
      setSaveStatus("saving");
      try {
        const payload: Record<string, unknown> = {
          artist_name: data.artist_name,
          full_name: data.full_name,
          genres: data.genres
            ? data.genres.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          moods: data.moods
            ? data.moods.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          pro_affiliation: data.pro_affiliation || "",
          ipi_number: data.ipi_number || "",
          goals: currentGoals,
        };

        await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("idle");
      }
    },
    []
  );

  // Debounced auto-save for form fields
  useEffect(() => {
    const subscription = watch(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        save(getValues(), goals);
      }, 2000);
    });
    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [watch, save, getValues, goals]);

  const toggleGoal = (goal: string) => {
    setGoals((prev) => {
      const next = prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal];
      // Trigger save on goal toggle
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        save(getValues(), next);
      }, 2000);
      return next;
    });
  };

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-sm text-[#A3A3A3]">
            Manage your account and preferences
          </p>
        </div>
        <span
          className={`text-xs transition-opacity ${saveStatus === "idle" ? "opacity-0" : "opacity-100"} ${saveStatus === "saving" ? "text-amber-400" : "text-emerald-400"}`}
        >
          {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : ""}
        </span>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-16 rounded-full bg-[#1A1A1A] flex items-center justify-center text-2xl text-[#A3A3A3]">
              {watch("artist_name")?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {watch("artist_name") || "Artist"}
              </p>
              <p className="text-xs text-[#A3A3A3]">{email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="artist_name">Artist Name</Label>
              <Input id="artist_name" {...register("artist_name")} />
            </div>
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" {...register("full_name")} />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Music */}
      <Card>
        <CardHeader>
          <CardTitle>Music</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="genres">
              Genres <span className="text-[#555] font-normal">(comma-separated)</span>
            </Label>
            <Input
              id="genres"
              {...register("genres")}
              placeholder={GENRES.slice(0, 4).join(", ")}
            />
          </div>
          <div>
            <Label htmlFor="moods">
              Moods <span className="text-[#555] font-normal">(comma-separated)</span>
            </Label>
            <Input
              id="moods"
              {...register("moods")}
              placeholder="Uplifting, Dark, Chill"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pro_affiliation">PRO Affiliation</Label>
              <select
                id="pro_affiliation"
                className="flex h-9 w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-1 text-sm text-white"
                value={watch("pro_affiliation")}
                onChange={(e) =>
                  setValue("pro_affiliation", e.target.value, { shouldDirty: true })
                }
              >
                <option value="">Select PRO</option>
                {PRO_AFFILIATIONS.map((pro) => (
                  <option key={pro} value={pro}>
                    {pro}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="ipi_number">IPI Number</Label>
              <Input
                id="ipi_number"
                {...register("ipi_number")}
                placeholder="00000000000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#A3A3A3] mb-3">
            What types of sync placements are you targeting?
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {GOAL_OPTIONS.map((goal) => (
              <button
                key={goal.value}
                type="button"
                onClick={() => toggleGoal(goal.value)}
                className={`rounded-md border px-3 py-2 text-sm text-left transition-colors ${
                  goals.includes(goal.value)
                    ? "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]"
                    : "border-[#1A1A1A] text-[#A3A3A3] hover:border-[#333] hover:text-white"
                }`}
              >
                {goal.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
          <Separator />
          <div>
            <h4 className="text-sm font-medium text-red-400 mb-1">Danger Zone</h4>
            <p className="text-xs text-[#A3A3A3] mb-3">
              Account deletion and data export options coming soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
