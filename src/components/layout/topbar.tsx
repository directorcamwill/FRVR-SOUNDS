"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, Settings, User } from "lucide-react";
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

const pageTitles: Record<string, string> = {
  "/command-center": "Command Center",
  "/vault": "Song Vault",
  "/pipeline": "Opportunity Pipeline",
  "/submissions": "Submissions",
  "/intelligence": "Intelligence Briefs",
  "/content": "Content Studio",
  "/business": "Business Setup",
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
    <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 md:px-6 bg-[#0A0A0A] border-b border-[#1F1F1F]">
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-accent hover:text-accent-foreground">
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 bg-[#0A0A0A]">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <MobileSidebar />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <NotificationsPopover />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent">
            <div className="size-7 rounded-full bg-[#1A1A1A] flex items-center justify-center text-xs text-[#A3A3A3]">
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
