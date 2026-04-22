export const metadata = { title: "FRVR SOUNDS · Offline" };

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black px-6 text-center">
      <div className="max-w-sm space-y-4">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">FRVR SOUNDS</p>
        <h1 className="font-display text-3xl text-white">You're offline</h1>
        <p className="text-sm text-white/60 leading-relaxed">
          The catalog, your vault, and AI tools need a connection. We'll pick up where you left off as soon as you're back online.
        </p>
      </div>
    </main>
  );
}
