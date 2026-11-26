// components/notification-prompt-banner.tsx
"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const DISMISS_KEY = "notif-prompt-dismissed";

export function NotificationPromptBanner() {
  const { permission, subscribe, loading } = usePushNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Wag ipakita kung naka-enable na, na-deny na, or dinismiss na dati.
    if (permission === "granted" || permission === "denied") return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    // Delay para hindi agad-agad, natural feel — user makapag-explore muna.
    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, [permission]);

  function handleDismiss() {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  }

  async function handleEnable() {
    await subscribe();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border border-moss-200 bg-white p-4 shadow-lg sm:left-4 sm:right-auto">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss-900/10">
        <Bell className="h-4 w-4 text-moss-900" />
      </span>

      <div className="flex-1">
        <p className="text-sm font-semibold text-moss-900">Stay in the loop</p>
        <p className="mt-0.5 text-xs text-moss-500">
          Stay updated with our latest promotions
        </p>

        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={handleEnable} disabled={loading}>
            {loading ? "Enabling..." : "Enable"}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            Not now
          </Button>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        aria-label="Close"
        className="shrink-0 text-moss-400 hover:text-moss-900"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
