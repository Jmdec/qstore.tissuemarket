// components/nav-notification-bell.tsx
"use client";

import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function NavNotificationBell() {
  const { permission, subscribe, loading } = usePushNotifications();
  const isBlocked = permission === "denied";
  const isEnabled = permission === "granted";

  // Already enabled — nothing left to do here, hide the bell entirely.
  if (isEnabled) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={subscribe}
      disabled={loading}
      aria-label={
        isBlocked
          ? "Notifications blocked — check browser settings"
          : "Enable notifications"
      }
      title={
        isBlocked
          ? "Notifications blocked — check browser settings"
          : "Enable notifications"
      }
      className="relative"
    >
      {isBlocked ? (
        <BellOff className="h-5 w-5 text-red-400" />
      ) : (
        <Bell className="h-5 w-5" />
      )}
      {!isBlocked && !loading && (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
      )}
    </Button>
  );
}
