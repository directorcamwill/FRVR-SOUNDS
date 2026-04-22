import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AIAssistant } from "@/components/layout/ai-assistant";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { TrialStatusBanner } from "@/components/layout/trial-status-banner";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { AmbientOrbs, Scanline } from "@/components/ui/motion";

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
        <main className="flex-1 overflow-y-auto p-6 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] md:pb-6 relative">
          {/* Ambient red glow - top right (preserved from v1) */}
          <div
            className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none z-0"
            style={{
              background: "radial-gradient(ellipse at top right, rgba(220, 38, 38, 0.04) 0%, transparent 70%)",
            }}
          />
          <AmbientOrbs />
          <Scanline />
          <div className="relative z-10">
            <AnnouncementBanner />
            <TrialStatusBanner />
            {children}
          </div>
        </main>
      </div>
      <AIAssistant />
      <MobileTabBar />
    </div>
  );
}
