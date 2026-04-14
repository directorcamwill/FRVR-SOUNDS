"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Info, AlertTriangle, AlertOctagon, Flame, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  agent_type: string;
  severity: "info" | "warning" | "urgent" | "critical";
  title: string;
  message: string;
  action_url: string | null;
  read: boolean;
  created_at: string;
}

const severityConfig: Record<string, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: "text-blue-400" },
  warning: { icon: AlertTriangle, color: "text-amber-400" },
  urgent: { icon: Flame, color: "text-orange-400" },
  critical: { icon: AlertOctagon, color: "text-red-400" },
};

export function NotificationsPopover() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAlerts(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleMarkAllRead = async () => {
    const ids = alerts.map((a) => a.id);
    if (!ids.length) return;
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        setAlerts([]);
      }
    } catch {
      // ignore
    }
  };

  const handleAlertClick = (alert: Alert) => {
    if (alert.action_url) {
      router.push(alert.action_url);
      setOpen(false);
    }
  };

  const unreadCount = alerts.length;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-center rounded-md h-8 w-8 text-[#A3A3A3] hover:text-white hover:bg-accent relative"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-red-600/30">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-black border border-[#1A1A1A] rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs text-[#A3A3A3] hover:text-white"
              >
                <CheckCheck className="size-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <Bell className="size-8 text-[#333] mb-2" />
                <p className="text-sm text-[#A3A3A3]">No new notifications</p>
              </div>
            ) : (
              alerts.map((alert) => {
                const config = severityConfig[alert.severity] || severityConfig.info;
                const Icon = config.icon;
                return (
                  <div
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    className={`px-4 py-3 border-b border-[#1A1A1A] last:border-b-0 hover:bg-[#111111] transition-colors ${alert.action_url ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`size-4 mt-0.5 shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {alert.title}
                        </p>
                        <p className="text-xs text-[#A3A3A3] mt-0.5 line-clamp-2">
                          {alert.message}
                        </p>
                        <p className="text-[10px] text-[#555] mt-1">
                          {formatDistanceToNow(new Date(alert.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
