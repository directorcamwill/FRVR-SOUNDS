"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  FlaskConical,
  Send,
  Music,
  Clock,
  RefreshCw,
  Loader2,
  ExternalLink,
  Search,
  Library,
  Filter,
  Check,
  Lock,
  Unlock,
  Star,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GENRES, MOODS } from "@/lib/utils/constants";
import { SYNC_LIBRARIES, LIBRARY_CATEGORIES } from "@/lib/knowledge/sync-libraries";

interface SongLabProject {
  id: string;
  title: string;
  status: string;
  bpm: number | null;
  key: string | null;
  genre: string | null;
  mood: string | null;
  created_at: string;
  updated_at: string;
  song_id: string | null;
}

const BPM_RANGES = [
  { value: "60-80", label: "Slow (60-80)" },
  { value: "80-110", label: "Mid (80-110)" },
  { value: "110-140", label: "Uptempo (110-140)" },
  { value: "140+", label: "Fast (140+)" },
];

const PURPOSES = [
  "TV", "Film", "Trailer", "Commercial", "Video Game", "YouTube/Influencer", "Animation", "Podcast",
];

const difficultyColors: Record<string, string> = {
  easy: "text-emerald-400 border-emerald-500/20",
  moderate: "text-amber-400 border-amber-500/20",
  selective: "text-red-400 border-red-500/20",
};

export default function SongLabPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<SongLabProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"submit" | "catalog" | "libraries">("submit");
  const [libraryFilter, setLibraryFilter] = useState("All");
  const [librarySearch, setLibrarySearch] = useState("");
  const [expandedLibrary, setExpandedLibrary] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    genre: "",
    mood: "",
    bpm_range: "",
    purpose: "",
    has_instrumentals: false,
    has_clean_version: false,
    has_stems: false,
    notes: "",
  });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/song-lab");
      if (res.ok) setProjects(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/song-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          genre: form.genre || null,
          mood: form.mood || null,
          bpm: form.bpm_range ? parseInt(form.bpm_range) : null,
          notes: [
            form.purpose ? `Target: ${form.purpose}` : "",
            form.has_instrumentals ? "Has instrumentals" : "",
            form.has_clean_version ? "Has TV-clean version" : "",
            form.has_stems ? "Has stems" : "",
            form.notes,
          ].filter(Boolean).join("\n"),
        }),
      });
      if (res.ok) {
        setForm({ title: "", genre: "", mood: "", bpm_range: "", purpose: "", has_instrumentals: false, has_clean_version: false, has_stems: false, notes: "" });
        fetchProjects();
        setActiveTab("catalog");
      }
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const filteredLibraries = SYNC_LIBRARIES.filter((lib) => {
    if (libraryFilter !== "All" && lib.category !== libraryFilter) return false;
    if (librarySearch && !lib.name.toLowerCase().includes(librarySearch.toLowerCase()) && !lib.description.toLowerCase().includes(librarySearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Song Lab</h2>
        <p className="text-sm text-[#666]">
          Create, score, strategize, submit — the sync licensing pipeline
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1A1A1A] pb-px">
        {[
          { id: "submit" as const, label: "Submit New Song", icon: Send },
          { id: "catalog" as const, label: `Song Catalog (${projects.length})`, icon: Music },
          { id: "libraries" as const, label: `Sync Libraries (${SYNC_LIBRARIES.length})`, icon: Library },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
              activeTab === tab.id
                ? "text-white border-red-500"
                : "text-[#666] border-transparent hover:text-[#999]"
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "submit" && (
          <motion.div
            key="submit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="glass-card rounded-xl p-6 space-y-6"
          >
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-red-500" />
              <h3 className="text-lg font-semibold text-white">Submit New Song</h3>
            </div>

            {/* Song Title */}
            <div className="space-y-2">
              <Label className="text-white">
                Song Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter song title"
                className="bg-black border-[#1A1A1A] focus:border-red-500 h-11"
              />
            </div>

            {/* Two column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Genre */}
              <div className="space-y-2">
                <Label className="text-[#999]">Genre</Label>
                <Select value={form.genre || ""} onValueChange={(v: string | null) => setForm({ ...form, genre: v || "" })}>
                  <SelectTrigger className="bg-black border-[#1A1A1A] h-11">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mood */}
              <div className="space-y-2">
                <Label className="text-[#999]">Mood</Label>
                <Select value={form.mood || ""} onValueChange={(v: string | null) => setForm({ ...form, mood: v || "" })}>
                  <SelectTrigger className="bg-black border-[#1A1A1A] h-11">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOODS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* BPM Range */}
              <div className="space-y-2">
                <Label className="text-[#999]">BPM Range</Label>
                <Select value={form.bpm_range || ""} onValueChange={(v: string | null) => setForm({ ...form, bpm_range: v || "" })}>
                  <SelectTrigger className="bg-black border-[#1A1A1A] h-11">
                    <SelectValue placeholder="Select BPM range" />
                  </SelectTrigger>
                  <SelectContent>
                    {BPM_RANGES.map((b) => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Purpose/Target */}
              <div className="space-y-2">
                <Label className="text-[#999]">Purpose / Target</Label>
                <Select value={form.purpose || ""} onValueChange={(v: string | null) => setForm({ ...form, purpose: v || "" })}>
                  <SelectTrigger className="bg-black border-[#1A1A1A] h-11">
                    <SelectValue placeholder="What's this for?" />
                  </SelectTrigger>
                  <SelectContent>
                    {PURPOSES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.has_instrumentals}
                  onCheckedChange={(c) => setForm({ ...form, has_instrumentals: !!c })}
                />
                <Label className="text-[#999]">Has Instrumentals</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.has_clean_version}
                  onCheckedChange={(c) => setForm({ ...form, has_clean_version: !!c })}
                />
                <Label className="text-[#999]">Has TV-Clean Version</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.has_stems}
                  onCheckedChange={(c) => setForm({ ...form, has_stems: !!c })}
                />
                <Label className="text-[#999]">Has Stems</Label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-[#999]">Song Notes / Description</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes about the track..."
                className="bg-black border-[#1A1A1A] focus:border-red-500 min-h-[80px]"
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!form.title.trim() || submitting}
              className="w-full h-12 text-base bg-red-600 hover:bg-red-700"
            >
              {submitting ? (
                <Loader2 className="size-5 animate-spin mr-2" />
              ) : (
                <Send className="size-5 mr-2" />
              )}
              Submit to Song Lab
            </Button>
          </motion.div>
        )}

        {activeTab === "catalog" && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Catalog Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="size-5 text-red-500" />
                <span className="text-white font-semibold">{projects.length} tracks</span>
              </div>
              <Button variant="outline" size="sm" onClick={fetchProjects} className="border-[#1A1A1A]">
                <RefreshCw className="size-3.5 mr-1.5" />
                Refresh
              </Button>
            </div>

            {/* Catalog Grid */}
            {loading ? (
              <div className="text-center py-12 text-[#666]">Loading catalog...</div>
            ) : projects.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <FlaskConical className="size-12 text-[#333] mx-auto mb-3" />
                <h3 className="text-sm font-medium text-white mb-1">No tracks yet</h3>
                <p className="text-xs text-[#666] mb-4">Submit your first song to start building your catalog</p>
                <Button size="sm" onClick={() => setActiveTab("submit")}>
                  <Send className="size-3.5 mr-1.5" />
                  Submit a Song
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project, idx) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => router.push(`/song-lab/${project.id}`)}
                    className="group glass-card rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-red-500/30 transition-all"
                  >
                    {/* Track Number */}
                    <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors truncate">
                        {project.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {project.genre && <span className="text-[10px] text-[#666]">{project.genre}</span>}
                        {project.mood && <span className="text-[10px] text-[#666]">{project.mood}</span>}
                        {project.bpm && <span className="text-[10px] text-[#666]">{project.bpm} BPM</span>}
                      </div>
                    </div>

                    {/* Status */}
                    <Badge variant="outline" className="text-[10px] capitalize border-[#1A1A1A]">
                      {project.status}
                    </Badge>

                    {/* Vault indicator */}
                    {project.song_id && (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Check className="size-3.5" />
                        <span className="text-[10px]">In Vault</span>
                      </div>
                    )}

                    {/* Date */}
                    <span className="text-[10px] text-[#444] shrink-0">
                      {new Date(project.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "libraries" && (
          <motion.div
            key="libraries"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Library Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Library className="size-5 text-red-500" />
                <span className="text-white font-semibold">{filteredLibraries.length} libraries</span>
              </div>
              <div className="relative flex-1 max-w-xs">
                <Search className="size-4 text-[#444] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="Search libraries..."
                  className="bg-black border-[#1A1A1A] pl-9 h-9"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {LIBRARY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setLibraryFilter(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                    libraryFilter === cat
                      ? "bg-red-600 text-white"
                      : "bg-[#111] text-[#666] hover:text-white border border-[#1A1A1A]"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Library List */}
            <div className="space-y-2">
              {filteredLibraries.map((lib, idx) => {
                const isExpanded = expandedLibrary === lib.name;
                return (
                  <motion.div
                    key={lib.name}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="glass-card rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedLibrary(isExpanded ? null : lib.name)}
                      className="w-full text-left p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Exclusive indicator */}
                      <div className={cn(
                        "size-8 rounded-lg flex items-center justify-center shrink-0",
                        lib.exclusive ? "bg-red-500/10" : "bg-emerald-500/10"
                      )}>
                        {lib.exclusive ? (
                          <Lock className="size-4 text-red-400" />
                        ) : (
                          <Unlock className="size-4 text-emerald-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{lib.name}</span>
                          <Badge variant="outline" className="text-[9px] border-[#1A1A1A] text-[#666]">
                            {lib.category}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[#666] truncate mt-0.5">{lib.description}</p>
                      </div>

                      {/* Difficulty */}
                      <Badge variant="outline" className={cn("text-[10px] capitalize shrink-0", difficultyColors[lib.difficulty])}>
                        {lib.difficulty}
                      </Badge>

                      {isExpanded ? <ChevronUp className="size-4 text-[#444]" /> : <ChevronDown className="size-4 text-[#444]" />}
                    </button>

                    {/* Expanded */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-[#1A1A1A] pt-3">
                            <p className="text-xs text-[#999]">{lib.description}</p>

                            <div className="flex flex-wrap gap-1.5">
                              {lib.genres.map((g) => (
                                <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-[#111] border border-[#1A1A1A] text-[#999]">
                                  {g}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center gap-4 text-[11px]">
                              <span className={lib.exclusive ? "text-red-400" : "text-emerald-400"}>
                                {lib.exclusive ? "Exclusive" : "Non-Exclusive"}
                              </span>
                              <span className={cn("capitalize", difficultyColors[lib.difficulty]?.split(" ")[0])}>
                                {lib.difficulty} to get in
                              </span>
                            </div>

                            <a
                              href={`https://${lib.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Visit {lib.website}
                              <ExternalLink className="size-3" />
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
