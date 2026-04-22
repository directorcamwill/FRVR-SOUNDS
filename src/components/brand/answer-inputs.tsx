"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Plus } from "lucide-react";
import type { BrandQuestion, RepeaterField } from "@/lib/brand/modules";

// ── Text (single line) ────────────────────────────────────────────────────

export function TextInput({
  q,
  value,
  onChange,
  onBlur,
}: {
  q: BrandQuestion;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  return (
    <Input
      placeholder={q.placeholder}
      value={value}
      maxLength={q.maxLength}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className="bg-zinc-950 border-white/10 text-white text-base h-11"
    />
  );
}

// ── Textarea (narrative) ──────────────────────────────────────────────────

export function TextareaInput({
  q,
  value,
  onChange,
  onBlur,
}: {
  q: BrandQuestion;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  return (
    <Textarea
      placeholder={q.placeholder}
      value={value}
      rows={5}
      maxLength={q.maxLength}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className="bg-zinc-950 border-white/10 text-white text-base leading-relaxed"
    />
  );
}

// ── Chips (array of strings) ──────────────────────────────────────────────

export function ChipsInput({
  q,
  value,
  onChange,
  onCommit,
}: {
  q: BrandQuestion;
  value: string[];
  onChange: (chips: string[]) => void;
  onCommit?: () => void;
}) {
  const [draft, setDraft] = useState("");

  const add = (v: string) => {
    const clean = v.trim();
    if (!clean) return;
    if (value.includes(clean)) return;
    onChange([...value, clean]);
    setDraft("");
  };

  const remove = (v: string) => {
    onChange(value.filter((x) => x !== v));
  };

  const suggestions = (q.chipOptions ?? []).filter((o) => !value.includes(o));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
        {value.length === 0 && (
          <span className="text-sm text-white/30">No entries yet.</span>
        )}
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-200 px-3 py-1 text-xs"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="-mr-0.5 hover:text-white"
              aria-label={`Remove ${v}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            }
          }}
          onBlur={() => {
            if (draft.trim()) add(draft);
            onCommit?.();
          }}
          placeholder={q.placeholder ?? "Type and press Enter"}
          className="bg-zinc-950 border-white/10 text-white"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => add(draft)}
          className="shrink-0"
        >
          <Plus className="size-3.5 mr-1" />
          Add
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-white/40">
            Quick picks
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => add(o)}
                className="inline-flex items-center rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-white/60 hover:border-white/30 hover:text-white transition-colors"
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Multi-field (N labeled slots, each writes to a distinct wiki column) ──

export function MultiFieldInput({
  q,
  values,
  onChange,
  onCommit,
}: {
  q: BrandQuestion;
  values: string[];
  onChange: (values: string[]) => void;
  onCommit?: () => void;
}) {
  const slots = q.multiFields ?? [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {slots.map((s, i) => {
        const isColor = s.input_type === "color";
        const val = values[i] ?? "";
        return (
          <div
            key={i}
            className={cn(
              "space-y-1.5",
              slots.length % 2 !== 0 && i === slots.length - 1
                ? "md:col-span-2"
                : "",
            )}
          >
            <p className="text-[10px] uppercase tracking-wider text-white/50">
              {s.label}
            </p>
            <div className="flex gap-2 items-stretch">
              {isColor && val.trim() && (
                <span
                  className="size-10 rounded border border-white/10 shrink-0"
                  style={{ backgroundColor: val.trim() }}
                  aria-hidden
                />
              )}
              <Input
                type={s.input_type === "number" ? "number" : "text"}
                value={val}
                onChange={(e) => {
                  const copy = [...values];
                  while (copy.length < slots.length) copy.push("");
                  copy[i] = e.target.value;
                  onChange(copy);
                }}
                onBlur={onCommit}
                placeholder={s.placeholder}
                className="bg-zinc-950 border-white/10 text-white"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Templated (N labeled slots → joined string) ───────────────────────────

export function TemplatedInput({
  q,
  slots,
  onChange,
  onCommit,
}: {
  q: BrandQuestion;
  slots: string[];
  onChange: (slots: string[]) => void;
  onCommit?: () => void;
}) {
  const labels = q.templatedSlots ?? [];
  const ensure = (arr: string[]) => {
    const out = [...arr];
    while (out.length < labels.length) out.push("");
    return out;
  };

  const vals = ensure(slots);

  return (
    <div className="space-y-3">
      {labels.map((slot, i) => (
        <div key={i} className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-white/50">
            {slot.label}
          </p>
          <Input
            value={vals[i] ?? ""}
            onChange={(e) => {
              const copy = [...vals];
              copy[i] = e.target.value;
              onChange(copy);
            }}
            onBlur={onCommit}
            placeholder={slot.placeholder}
            className="bg-zinc-950 border-white/10 text-white"
          />
        </div>
      ))}
    </div>
  );
}

// ── Two-box (before → after, writes TWO fields) ───────────────────────────

export function TwoBoxInput({
  q,
  before,
  after,
  onChange,
  onCommit,
}: {
  q: BrandQuestion;
  before: string;
  after: string;
  onChange: (before: string, after: string) => void;
  onCommit?: () => void;
}) {
  const labels = q.templatedSlots ?? [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-white/50">
          {labels[0]?.label ?? "Before"}
        </p>
        <Textarea
          rows={3}
          value={before}
          onChange={(e) => onChange(e.target.value, after)}
          onBlur={onCommit}
          placeholder={labels[0]?.placeholder}
          className="bg-zinc-950 border-white/10 text-white"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-white/50">
          {labels[1]?.label ?? "After"}
        </p>
        <Textarea
          rows={3}
          value={after}
          onChange={(e) => onChange(before, e.target.value)}
          onBlur={onCommit}
          placeholder={labels[1]?.placeholder}
          className="bg-zinc-950 border-white/10 text-white"
        />
      </div>
    </div>
  );
}

// ── Intensity dial (2 sliders + notes, writes 3 fields) ───────────────────

export function IntensityDialInput({
  q,
  energy,
  intensity,
  notes,
  onChange,
  onCommit,
}: {
  q: BrandQuestion;
  energy: number | null;
  intensity: number | null;
  notes: string;
  onChange: (
    energy: number | null,
    intensity: number | null,
    notes: string
  ) => void;
  onCommit?: () => void;
}) {
  return (
    <div className="space-y-5">
      <DialRow
        label={q.energyLabel ?? "Energy"}
        value={energy}
        onChange={(v) => onChange(v, intensity, notes)}
        onCommit={onCommit}
      />
      <DialRow
        label={q.intensityLabel ?? "Intensity"}
        value={intensity}
        onChange={(v) => onChange(energy, v, notes)}
        onCommit={onCommit}
      />
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-white/50">
          {q.notesLabel ?? "Notes"}
        </p>
        <Textarea
          rows={2}
          value={notes}
          onChange={(e) => onChange(energy, intensity, e.target.value)}
          onBlur={onCommit}
          className="bg-zinc-950 border-white/10 text-white"
          placeholder="optional"
        />
      </div>
    </div>
  );
}

function DialRow({
  label,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  onCommit?: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-white/60">
          {label}
        </p>
        <span className="text-sm font-semibold text-white tabular-nums">
          {value ?? "—"}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value ?? 5}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        className="w-full accent-red-500"
      />
      <div className="flex justify-between text-[10px] text-white/30">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}

// ── Repeater (array of objects) ───────────────────────────────────────────

export function RepeaterInput({
  q,
  items,
  onChange,
  onCommit,
}: {
  q: BrandQuestion;
  items: Array<Record<string, string>>;
  onChange: (items: Array<Record<string, string>>) => void;
  onCommit?: () => void;
}) {
  const schema = q.repeaterSchema ?? [];
  const min = q.repeaterMin ?? 1;

  // ensure we always render at least `min` rows
  useEffect(() => {
    if (items.length < min) {
      const pad = Array.from({ length: min - items.length }, () => emptyItem(schema));
      onChange([...items, ...pad]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (i: number, field: string, val: string) => {
    const copy = [...items];
    copy[i] = { ...(copy[i] ?? {}), [field]: val };
    onChange(copy);
  };

  const add = () => {
    if (q.repeaterMax && items.length >= q.repeaterMax) return;
    onChange([...items, emptyItem(schema)]);
  };

  const remove = (i: number) => {
    const copy = [...items];
    copy.splice(i, 1);
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-2 relative"
        >
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-2 right-2 text-white/40 hover:text-red-400 transition-colors"
            aria-label="Remove"
          >
            <X className="size-3.5" />
          </button>
          {schema.map((f: RepeaterField) => (
            <div key={f.field} className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-white/40">
                {f.label}
              </p>
              <Input
                value={item[f.field] ?? ""}
                onChange={(e) => update(i, f.field, e.target.value)}
                onBlur={onCommit}
                placeholder={f.placeholder}
                className="bg-zinc-950 border-white/10 text-white"
              />
            </div>
          ))}
        </div>
      ))}
      {(!q.repeaterMax || items.length < q.repeaterMax) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          className="w-full"
        >
          <Plus className="size-3.5 mr-1.5" />
          Add another
        </Button>
      )}
    </div>
  );
}

function emptyItem(schema: RepeaterField[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of schema) out[f.field] = "";
  return out;
}

// ── Strong vs weak examples (collapsible reference) ───────────────────────

export function StrongVsWeakExamples({ q }: { q: BrandQuestion }) {
  const [open, setOpen] = useState(false);
  if (!q.strongExample && !q.weakExample) return null;
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "text-[11px] uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors",
        )}
      >
        {open ? "Hide" : "See"} examples
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {q.strongExample && (
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.03] p-3 text-xs text-emerald-100/90">
              <p className="text-[10px] uppercase tracking-wider text-emerald-300/70 mb-1">
                Strong
              </p>
              {q.strongExample}
            </div>
          )}
          {q.weakExample && (
            <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 text-xs text-white/50 line-through decoration-white/20">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1 no-underline">
                Weak
              </p>
              {q.weakExample}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
