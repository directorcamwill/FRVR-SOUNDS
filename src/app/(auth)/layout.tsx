export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      <div className="mb-8 flex items-center gap-1">
        <span className="text-2xl font-bold text-[#DC2626]">FRVR</span>
        <span className="text-2xl font-bold text-white">SOUNDS</span>
      </div>
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-[#1A1A1A] bg-[#111111] p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
