"use client";

import * as React from "react";

export type PwaUpdateStatus =
  | "idle"
  | "installing"
  | "installed"
  | "activating"
  | "activated";

/**
 * Detects when a new service worker has installed and is waiting to
 * activate (because skipWaiting: false in next.config.js), exposes the
 * current step of that process (`status`), and a function to trigger
 * the update on demand.
 */
export function usePwaUpdate() {
  const [waitingWorker, setWaitingWorker] =
    React.useState<ServiceWorker | null>(null);
  const [status, setStatus] = React.useState<PwaUpdateStatus>("idle");
  const reloadingRef = React.useRef(false);

  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const trackWorker = (worker: ServiceWorker) => {
      if (worker.state === "installing") setStatus("installing");

      worker.addEventListener("statechange", () => {
        switch (worker.state) {
          case "installing":
            setStatus("installing");
            break;
          case "installed":
            if (navigator.serviceWorker.controller) {
              setWaitingWorker(worker);
              setStatus("installed");
            }
            break;
          case "activating":
            setStatus("activating");
            break;
          case "activated":
            setStatus("activated");
            break;
        }
      });
    };

    const handleUpdateFound = () => {
      const installingWorker = registration?.installing;
      if (installingWorker) trackWorker(installingWorker);
    };

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      registration = reg;

      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(reg.waiting);
        setStatus("installed");
        trackWorker(reg.waiting);
      }
      if (reg.installing) trackWorker(reg.installing);

      reg.addEventListener("updatefound", handleUpdateFound);
    });

    // NOTE: we no longer reload directly from here. We only mark
    // "activated" and let applyUpdate's own timer decide when to
    // actually reload, so there's a guaranteed visible window between
    // "activating" -> "activated" -> reload instead of an instant jump.
    const handleControllerChange = () => {
      setStatus("activated");
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    return () => {
      registration?.removeEventListener("updatefound", handleUpdateFound);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);

  const applyUpdate = React.useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    const worker = reg?.waiting ?? waitingWorker;

    if (!worker) {
      window.location.reload();
      return;
    }

    setStatus("activating");
    worker.postMessage({ type: "SKIP_WAITING" });

    // Give the UI a guaranteed minimum time to actually show
    // "activating" / "activated" before we force a reload — otherwise
    // on fast devices the whole thing can resolve in under a frame and
    // it just *looks* like an instant reload with no feedback at all.
    const MIN_VISIBLE_MS = 900;
    const start = Date.now();

    const finish = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      const elapsed = Date.now() - start;
      const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);
      window.setTimeout(() => window.location.reload(), remaining);
    };

    // Poll for the controller actually switching over (covers browsers
    // where controllerchange fires before our state update lands) —
    // but always fall back to a hard timeout so we never hang forever.
    const checkInterval = window.setInterval(() => {
      if (navigator.serviceWorker.controller === worker) {
        window.clearInterval(checkInterval);
        finish();
      }
    }, 100);

    window.setTimeout(() => {
      window.clearInterval(checkInterval);
      finish();
    }, 5000);
  }, [waitingWorker]);

  return {
    updateAvailable: !!waitingWorker,
    status,
    applyUpdate,
  };
}
