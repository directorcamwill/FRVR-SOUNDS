"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
}

const DISMISSED_KEY = "frvr.pwa.install.dismissed";
const DISMISS_WINDOW_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Hide if already installed (launched from home screen)
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // Respect recent dismissal
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      if (raw && Date.now() - Number(raw) < DISMISS_WINDOW_MS) return;
    } catch {}

    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS/.test(ua);
    if (ios) {
      setIsIOS(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch {}
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[360px] z-50 rounded-xl border border-white/10 bg-black/85 backdrop-blur-xl p-4 shadow-2xl"
      role="dialog"
      aria-label="Install FRVR Sounds"
    >
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 p-1 text-white/40 hover:text-white/80"
        aria-label="Dismiss install prompt"
      >
        <X className="size-3.5" />
      </button>
      <div className="flex items-start gap-3">
        <div className="shrink-0 size-10 rounded-lg bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center">
          <Download className="size-4 text-[#DC2626]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Install FRVR SOUNDS</p>
          {isIOS ? (
            <p className="mt-1 text-sm text-white/80 leading-relaxed">
              Tap the Share icon, then "Add to Home Screen" to install.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-white/80 leading-relaxed">
                Install for faster access, offline fallbacks, and a fullscreen catalog.
              </p>
              <button
                onClick={install}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-white px-3 py-1.5 rounded-full border border-[#DC2626]/40 bg-[#DC2626]/10 hover:bg-[#DC2626]/20 transition-colors"
              >
                Install
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
