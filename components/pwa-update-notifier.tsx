"use client";

import * as React from "react";
import { RefreshCw, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

import { usePwaUpdate, type PwaUpdateStatus } from "@/hooks/use-pwa-update";

const TOAST_ID = "pwa-update-toast";

const STATUS_COPY: Record<
  PwaUpdateStatus,
  { title: string; icon: React.ReactNode }
> = {
  idle: { title: "", icon: null },
  installing: {
    title: "Downloading update...",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
  },
  installed: {
    title: "Update ready to install",
    icon: <RefreshCw className="h-4 w-4" />,
  },
  activating: {
    title: "Installing update...",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
  },
  activated: {
    title: "Update installed — reloading...",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
};

export function PwaUpdateNotifier() {
  const { updateAvailable, status, applyUpdate } = usePwaUpdate();

  // Prevent re-showing a toast that was already shown or dismissed
  // for the current update, even if this effect re-fires because
  // applyUpdate (or something else) isn't referentially stable.
  const shownRef = React.useRef(false);
  const dismissedRef = React.useRef(false);

  React.useEffect(() => {
    if (!updateAvailable) {
      shownRef.current = false;
      dismissedRef.current = false;
      return;
    }

    if (status !== "installed") return;
    if (shownRef.current || dismissedRef.current) return;

    shownRef.current = true;

    toast("A new version of Quanta Paper is available", {
      id: TOAST_ID, // <-- stable id: reuses/updates instead of stacking
      description: "Update now to get the latest fixes and features.",
      icon: <RefreshCw className="h-4 w-4" />,
      duration: Infinity,
      action: {
        label: "Update",
        onClick: applyUpdate,
      },
      cancel: {
        label: <X className="h-4 w-4 text-red-500" />,
        onClick: () => {
          dismissedRef.current = true;
          toast.dismiss(TOAST_ID);
        },
      },
      cancelButtonStyle: {
        backgroundColor: "transparent",
        color: "rgb(239 68 68)",
        padding: "0.25rem",
      },
      onDismiss: () => {
        dismissedRef.current = true;
      },
    });
  }, [updateAvailable, status, applyUpdate]);

  React.useEffect(() => {
    if (status === "activating" || status === "activated") {
      const copy = STATUS_COPY[status];
      toast.loading(copy.title, {
        id: TOAST_ID, // same id — updates the existing toast in place
        icon: copy.icon,
        duration: Infinity,
      });
    }
  }, [status]);

  return null;
}
