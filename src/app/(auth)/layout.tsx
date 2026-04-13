export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-4">
      <div className="mb-8 flex items-center gap-1">
        <span className="text-2xl font-bold text-[#E87420]">FRVR</span>
        <span className="text-2xl font-bold text-white">SOUNDS</span>
      </div>
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
