import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AIAssistant } from "@/components/layout/ai-assistant";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-black">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-0 md:ml-60">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 relative">
          {/* Ambient red glow - top right */}
          <div
            className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none z-0"
            style={{
              background: "radial-gradient(ellipse at top right, rgba(220, 38, 38, 0.04) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
      <AIAssistant />
    </div>
  );
}
