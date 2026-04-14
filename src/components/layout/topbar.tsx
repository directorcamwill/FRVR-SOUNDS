"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, Settings, User, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { NotificationsPopover } from "@/components/layout/notifications-popover";
import { GlowDot } from "@/components/ui/motion";

const pageTitles: Record<string, string> = {
  "/command-center": "Command Center",
  "/vault": "Song Vault",
  "/pipeline": "Opportunity Pipeline",
  "/submissions": "Submissions",
  "/song-lab": "Song Lab",
  "/intelligence": "Intelligence Briefs",
  "/content": "Content Studio",
  "/business/vault": "Business Vault",
  "/business": "Business Setup",
  "/money/splits": "Splits & Ownership",
  "/money/registrations": "Registrations",
  "/money/accounts": "Account Hub",
  "/money": "Money Dashboard",
  "/learn": "Knowledge Base",
  "/timeline": "Timeline",
  "/deliverables": "Deliverables",
  "/daily": "Daily Execution",
  "/ideas": "Idea Generator",
  "/health": "Health Score",
  "/settings": "Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();

  const title =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "Dashboard";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 md:px-6 bg-black/80 backdrop-blur-xl border-b border-[#1A1A1A]">
      {/* Bottom gradient red line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600/20 to-transparent" />

      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-white/5 text-[#666] hover:text-white transition-colors">
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 bg-black border-[#1A1A1A]">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <MobileSidebar />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <div className="hidden md:flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <GlowDot color="green" size="sm" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">System Active</span>
        </div>
      </div>

      {/* Center: Command search (desktop only) */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <div className="w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#444]" />
          <input
            type="text"
            placeholder="Ask FRVR anything..."
            className="w-full bg-white/[0.03] backdrop-blur-sm border border-[#1A1A1A] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-red-500/30 focus:shadow-[0_0_15px_rgba(220,38,38,0.1)] transition-all"
            readOnly
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <NotificationsPopover />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-white/5">
            <div className="size-7 rounded-full bg-gradient-to-br from-[#333] via-[#555] to-[#333] flex items-center justify-center text-xs text-white font-medium ring-1 ring-[#1A1A1A]">
              A
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <User className="mr-2 size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
