// hooks/use-push-notifications.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("This browser doesn't support notifications.");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications are not supported on this browser.");
      return;
    }

    // Browser already blocked it before — no native prompt will show again.
    if (Notification.permission === "denied") {
      toast.error(
        "Notifications are blocked. Enable them from your browser's site settings.",
      );
      setPermission("denied");
      return;
    }

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        toast.error("Notifications were not enabled.");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        toast.error("Push notifications are not configured yet.");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) throw new Error("Failed to save subscription.");

      toast.success("Notifications enabled!");
    } catch (err) {
      console.error("Push subscription failed:", err);
      toast.error("Something went wrong enabling notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { permission, subscribe, loading };
}
