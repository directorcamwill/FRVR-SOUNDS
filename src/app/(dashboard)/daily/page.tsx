"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ListChecks,
  Plus,
  Loader2,
  Clock,
  AlertTriangle,
  Trash2,
  Music,
  Briefcase,
  Sparkles,
  Send,
  Settings,
  BookOpen,
  Circle,
  Flame,
  Target,
  Sun,
  Sunset,
  Moon,
  LayoutGrid,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyTask {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  due_date: string;
  completed_at: string | null;
  notes: string | null;
  recurring: boolean;
  time_block: string;
  created_at: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  music: Music,
  business: Briefcase,
  content: Sparkles,
  sync: Send,
  admin: Settings,
  learning: BookOpen,
  general: Circle,
};

const categoryColors: Record<string, string> = {
  music: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  business: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  content: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  sync: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  admin: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  learning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  general: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const priorityDots: Record<string, string> = {
  low: "bg-zinc-500",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  urgent: "bg-red-500",
};

const categories = [
  "all",
  "music",
  "business",
  "content",
  "sync",
  "admin",
  "learning",
];

const timeBlockIcons: Record<string, React.ElementType> = {
  morning: Sun,
  afternoon: Sunset,
  evening: Moon,
  anytime: LayoutGrid,
};

const timeBlockColors: Record<string, string> = {
  morning: "text-amber-400",
  afternoon: "text-orange-400",
  evening: "text-indigo-400",
  anytime: "text-[#A3A3A3]",
};

const quickTemplates = [
  {
    name: "Music Session",
    icon: Music,
    color: "text-purple-400",
    tasks: [
      { title: "Write for 30 min", category: "music", priority: "high" },
      { title: "Record ideas", category: "music", priority: "medium" },
      {
        title: "Review yesterday's work",
        category: "music",
        priority: "medium",
      },
    ],
  },
  {
    name: "Business Hour",
    icon: Briefcase,
    color: "text-blue-400",
    tasks: [
      {
        title: "Check submissions",
        category: "business",
        priority: "high",
      },
      {
        title: "Update metadata",
        category: "business",
        priority: "medium",
      },
      {
        title: "Review opportunities",
        category: "business",
        priority: "medium",
      },
    ],
  },
  {
    name: "Content Day",
    icon: Sparkles,
    color: "text-pink-400",
    tasks: [
      {
        title: "Film behind-the-scenes",
        category: "content",
        priority: "high",
      },
      { title: "Edit and post", category: "content", priority: "high" },
      {
        title: "Engage with audience",
        category: "content",
        priority: "medium",
      },
    ],
  },
  {
    name: "Sync Push",
    icon: Send,
    color: "text-cyan-400",
    tasks: [
      {
        title: "Research new briefs",
        category: "sync",
        priority: "high",
      },
      {
        title: "Submit to 3 opportunities",
        category: "sync",
        priority: "high",
      },
      {
        title: "Follow up on pending",
        category: "sync",
        priority: "medium",
      },
    ],
  },
];

export default function DailyPage() {
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  // Add task form
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newPriority, setNewPriority] = useState("medium");
  const [newTimeBlock, setNewTimeBlock] = useState("anytime");
  const [adding, setAdding] = useState(false);

  // Focus of the day
  const [focus, setFocus] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  // Streak
  const [streak, setStreak] = useState(0);

  const today = new Date();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Load focus and streak from localStorage
  useEffect(() => {
    const todayKey = new Date().toISOString().split("T")[0];
    const savedFocus = localStorage.getItem(`frvr_focus_${todayKey}`);
    if (savedFocus) setFocus(savedFocus);

    const savedStreak = parseInt(
      localStorage.getItem("frvr_streak") || "0"
    );
    setStreak(savedStreak);
  }, []);

  const saveFocus = (value: string) => {
    setFocus(value);
    const todayKey = new Date().toISOString().split("T")[0];
    localStorage.setItem(`frvr_focus_${todayKey}`, value);
  };

  // Update streak when tasks complete
  const updateStreak = useCallback(
    (tasks: DailyTask[]) => {
      if (tasks.length === 0) return;
      const allDone = tasks.every((t) => t.status === "done");
      const todayKey = new Date().toISOString().split("T")[0];
      const lastCompleteDay = localStorage.getItem("frvr_streak_last");

      if (allDone && lastCompleteDay !== todayKey) {
        // Check if yesterday was the last complete day
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().split("T")[0];

        let newStreak: number;
        if (lastCompleteDay === yesterdayKey) {
          newStreak = streak + 1;
        } else if (lastCompleteDay === todayKey) {
          newStreak = streak;
        } else {
          newStreak = 1;
        }
        setStreak(newStreak);
        localStorage.setItem("frvr_streak", String(newStreak));
        localStorage.setItem("frvr_streak_last", todayKey);
      }
    },
    [streak]
  );

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/today");
      if (res.ok) {
        const data = await res.json();
        setTodayTasks(data.today || []);
        setOverdueTasks(data.overdue || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (todayTasks.length > 0) {
      updateStreak(todayTasks);
    }
  }, [todayTasks, updateStreak]);

  const handleToggleDone = async (task: DailyTask) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTodayTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        setOverdueTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTodayTasks((prev) => prev.filter((t) => t.id !== taskId));
        setOverdueTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch {
      // ignore
    }
  };

  const handleAdd = async (
    title?: string,
    category?: string,
    priority?: string,
    timeBlock?: string
  ) => {
    const taskTitle = title || newTitle;
    if (!taskTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          category: category || newCategory,
          priority: priority || newPriority,
          due_date: new Date().toISOString().split("T")[0],
          time_block: timeBlock || newTimeBlock,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTodayTasks((prev) => [created, ...prev]);
        if (!title) {
          setNewTitle("");
          setShowAdd(false);
        }
      }
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  const handleApplyTemplate = async (
    template: (typeof quickTemplates)[number]
  ) => {
    for (const task of template.tasks) {
      await handleAdd(task.title, task.category, task.priority, "anytime");
    }
    setShowTemplates(false);
  };

  const filterTasks = (tasks: DailyTask[]) => {
    if (activeCategory === "all") return tasks;
    return tasks.filter((t) => t.category === activeCategory);
  };

  const groupByTimeBlock = (tasks: DailyTask[]) => {
    const groups: Record<string, DailyTask[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      anytime: [],
    };
    tasks.forEach((t) => {
      const block = t.time_block || "anytime";
      if (groups[block]) {
        groups[block].push(t);
      } else {
        groups.anytime.push(t);
      }
    });
    return groups;
  };

  const filteredToday = filterTasks(todayTasks);
  const filteredOverdue = filterTasks(overdueTasks);
  const doneCount = todayTasks.filter((t) => t.status === "done").length;
  const totalToday = todayTasks.length;
  const timeGroups = groupByTimeBlock(filteredToday);

  const renderTask = (task: DailyTask, index: number, isOverdue = false) => {
    const isDone = task.status === "done";
    const CatIcon = categoryIcons[task.category] || Circle;

    return (
      <div
        key={task.id}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
          isDone
            ? "bg-black opacity-60"
            : "bg-[#111] hover:bg-[#161616]"
        )}
        style={{
          animation: `fadeSlideIn 0.3s ease-out ${index * 0.03}s both`,
        }}
      >
        {/* Checkbox */}
        <button
          onClick={() => handleToggleDone(task)}
          className={cn(
            "size-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
            isDone
              ? "bg-emerald-500 border-emerald-500"
              : "border-[#333] hover:border-[#DC2626]"
          )}
        >
          {isDone && (
            <svg
              className="size-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              isDone ? "text-zinc-500 line-through" : "text-white"
            )}
          >
            {task.title}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={cn(
              "size-1.5 rounded-full",
              priorityDots[task.priority] || "bg-zinc-500"
            )}
          />
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] py-0 h-5",
              categoryColors[task.category] || ""
            )}
          >
            <CatIcon className="size-2.5 mr-0.5" />
            {task.category}
          </Badge>
          {isOverdue && <AlertTriangle className="size-3 text-red-400" />}
          <button
            onClick={() => handleDelete(task.id)}
            className="text-zinc-600 hover:text-red-400 ml-1"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Daily Execution</h2>
          <p className="text-sm text-[#A3A3A3]">
            {dayNames[today.getDay()]}, {monthNames[today.getMonth()]}{" "}
            {today.getDate()}, {today.getFullYear()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1"
            >
              <Flame className="size-3" />
              {streak} day streak
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <Zap className="size-4 mr-2" />
            Templates
          </Button>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="size-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Focus of the Day */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <Target className="size-5 text-[#DC2626] shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] text-[#666] uppercase tracking-wider block mb-1">
                Focus of the Day
              </label>
              <input
                type="text"
                value={focus}
                onChange={(e) => saveFocus(e.target.value)}
                placeholder="What is your #1 priority today?"
                className="w-full bg-transparent text-sm text-white font-medium placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Templates */}
      {showTemplates && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.name}
                onClick={() => handleApplyTemplate(template)}
                className="bg-[#111] border border-[#1A1A1A] rounded-lg p-3 text-left hover:border-[#DC2626]/30 transition-all group"
              >
                <Icon
                  className={cn(
                    "size-4 mb-1.5",
                    template.color
                  )}
                />
                <p className="text-xs font-medium text-white group-hover:text-[#DC2626] transition-colors">
                  {template.name}
                </p>
                <p className="text-[10px] text-[#666] mt-0.5">
                  {template.tasks.length} tasks
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Quick Add */}
      {showAdd && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                placeholder="What needs to be done?"
                className="flex-1 bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
                autoFocus
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-[#111] border border-[#1A1A1A] rounded px-2 py-2 text-xs text-white focus:outline-none"
              >
                <option value="general">General</option>
                <option value="music">Music</option>
                <option value="business">Business</option>
                <option value="content">Content</option>
                <option value="sync">Sync</option>
                <option value="admin">Admin</option>
                <option value="learning">Learning</option>
              </select>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="bg-[#111] border border-[#1A1A1A] rounded px-2 py-2 text-xs text-white focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <select
                value={newTimeBlock}
                onChange={(e) => setNewTimeBlock(e.target.value)}
                className="bg-[#111] border border-[#1A1A1A] rounded px-2 py-2 text-xs text-white focus:outline-none"
              >
                <option value="anytime">Anytime</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
              <Button size="sm" onClick={() => handleAdd()} disabled={adding}>
                {adding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Add"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ListChecks className="size-4 text-[#DC2626]" />
          <span className="text-sm text-white font-medium">
            {loading ? (
              <Skeleton className="h-4 w-16 inline-block" />
            ) : (
              `${doneCount} / ${totalToday} done`
            )}
          </span>
        </div>
        {overdueTasks.length > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-400" />
            <span className="text-sm text-red-400">
              {overdueTasks.length} overdue
            </span>
          </div>
        )}
        {!loading && totalToday > 0 && (
          <div className="flex-1 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#DC2626] to-emerald-400 rounded-full transition-all duration-500"
              style={{
                width: `${totalToday > 0 ? Math.round((doneCount / totalToday) * 100) : 0}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap capitalize",
              activeCategory === cat
                ? "bg-[#DC2626] text-white"
                : "bg-[#1A1A1A] text-[#A3A3A3] hover:text-white"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue */}
          {filteredOverdue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="size-4 text-red-400" />
                <h3 className="text-sm font-semibold text-red-400">
                  Overdue
                </h3>
                <span className="text-xs text-red-400/60">
                  ({filteredOverdue.length})
                </span>
              </div>
              <div className="space-y-1">
                {filteredOverdue.map((task, i) =>
                  renderTask(task, i, true)
                )}
              </div>
            </div>
          )}

          {/* Time Block Groups */}
          {(["morning", "afternoon", "evening", "anytime"] as const).map(
            (block) => {
              const tasks = timeGroups[block];
              if (!tasks || tasks.length === 0) return null;
              const BlockIcon = timeBlockIcons[block];
              const blockLabel =
                block.charAt(0).toUpperCase() + block.slice(1);
              return (
                <div key={block}>
                  <div className="flex items-center gap-2 mb-2">
                    <BlockIcon
                      className={cn(
                        "size-4",
                        timeBlockColors[block]
                      )}
                    />
                    <h3 className="text-sm font-semibold text-white">
                      {blockLabel}
                    </h3>
                    <span className="text-xs text-[#A3A3A3]">
                      ({tasks.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {tasks.map((task, i) => renderTask(task, i))}
                  </div>
                </div>
              );
            }
          )}

          {filteredToday.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ListChecks className="size-10 text-[#333] mb-3" />
                <h3 className="text-sm font-medium text-white mb-1">
                  No tasks for today
                </h3>
                <p className="text-xs text-[#A3A3A3]">
                  Click &quot;Add Task&quot; or use a template to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
