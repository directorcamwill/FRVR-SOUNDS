"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// Reads the frvr.visitor cookie on mount. If absent, children-renderers can
// call `promptUnlock()` to show the modal. On successful submit, a cookie
// is set (via the server) + localStorage mirror so downstream components can
// check `isUnlocked` synchronously.

export function useVisitorUnlock() {
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const cookie = document.cookie.split("; ").find((c) => c.startsWith("frvr.visitor="));
    if (cookie) setUnlocked(true);
    const local = localStorage.getItem("frvr.visitor");
    if (local) setUnlocked(true);
  }, []);

  const promptUnlock = () => setOpen(true);
  const dismiss = () => setOpen(false);

  const submit = async (email: string, name: string, company: string) => {
    const r = await fetch("/api/catalog/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, company, role: "supervisor" }),
    });
    if (!r.ok) throw new Error("Could not save");
    localStorage.setItem("frvr.visitor", email);
    setUnlocked(true);
    setOpen(false);
  };

  return { unlocked, promptUnlock, open, dismiss, submit };
}

export function VisitorGateModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string, name: string, company: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const go = async () => {
    if (!email) {
      setErr("Email required");
      return;
    }
    setErr(null);
    setSubmitting(true);
    try {
      await onSubmit(email, name, company);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not unlock");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-md w-full rounded-2xl border border-white/10 bg-[#0a0a0a] p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            <p className="text-[10px] uppercase tracking-[0.5em] text-[#DC2626] mb-3">
              Full access
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-black text-white leading-[0.95] tracking-tight">
              <span className="italic font-normal text-[#DC2626] mr-2">One</span>
              detail, then we&rsquo;re in.
            </h2>
            <p className="mt-3 text-sm text-white/60 italic font-display">
              Tell us who you are and the catalog opens — full tracks, shortlists, everything.
            </p>

            <div className="mt-6 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email *"
                autoFocus
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#DC2626]/50"
                onKeyDown={(e) => e.key === "Enter" && !submitting && go()}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#DC2626]/50"
                />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company"
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#DC2626]/50"
                />
              </div>
            </div>

            {err && (
              <p className="mt-3 text-[11px] text-red-400">{err}</p>
            )}

            <button
              onClick={go}
              disabled={submitting}
              className="mt-6 w-full py-3 rounded-full border border-[#DC2626] bg-[#DC2626]/15 hover:bg-[#DC2626]/25 text-sm uppercase tracking-[0.3em] text-white transition-colors disabled:opacity-50"
            >
              {submitting ? "Unlocking…" : "Unlock the catalog"}
            </button>

            <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-white/30 text-center">
              No spam. We&rsquo;ll only reach out if something fits.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
