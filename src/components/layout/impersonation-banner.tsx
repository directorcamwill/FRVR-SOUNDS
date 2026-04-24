"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Top-of-dashboard banner shown to super-admins while viewing as another
 * artist. Read-only — writes are blocked server-side in feature-guard. The
 * Stop button clears the impersonation cookie and refreshes the page.
 */

interface MeState {
  is_impersonating: boolean;
  impersonated_artist_name: string | null;
}

export function ImpersonationBanner() {
  const router = useRouter();
  const [state, setState] = useState<MeState | null>(null);
  const [stopping, setStopping] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/me");
      const data = await r.json();
      if (data?.authenticated) {
        setState({
          is_impersonating: !!data.is_impersonating,
          impersonated_artist_name: data.impersonated_artist_name ?? null,
        });
      } else {
        setState({ is_impersonating: false, impersonated_artist_name: null });
      }
    } catch {
      setState({ is_impersonating: false, impersonated_artist_name: null });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!state?.is_impersonating) return null;

  const stop = async () => {
    setStopping(true);
    try {
      const r = await fetch("/api/admin/impersonate", { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to stop");
      toast.success("Impersonation stopped.");
      router.refresh();
      // Belt-and-suspenders: reload to clear any stale client-side state
      setTimeout(() => window.location.reload(), 150);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to stop");
    } finally {
      setStopping(false);
    }
  };

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] px-4 py-2.5">
      <Eye className="size-4 text-amber-300 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">
          Viewing as{" "}
          <span className="font-semibold">
            {state.impersonated_artist_name ?? "this artist"}
          </span>{" "}
          <span className="text-[11px] text-amber-200/80 uppercase tracking-[0.15em] ml-2">
            read-only
          </span>
        </p>
        <p className="text-[11px] text-white/60">
          Writes and agent runs are blocked. Stop to return to your own account.
        </p>
      </div>
      <button
        onClick={stop}
        disabled={stopping}
        className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
      >
        <X className="size-3" />
        {stopping ? "Stopping…" : "Stop"}
      </button>
    </div>
  );
}
