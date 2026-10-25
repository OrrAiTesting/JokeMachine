"use client";

import { useEffect } from "react";

// Registers the service worker in production only (ARCHITECTURE.md, section 2.9)
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // Remove a worker left over from a local production run so dev code is never served from cache
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((r) => r.unregister()))
        .catch(() => {});
      return;
    }

    function register() {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then((registration) => {
          // Send the files of this first visit so the shell opens offline after one visit
          const urls = performance
            .getEntriesByType("resource")
            .map((entry) => entry.name)
            .filter((name) => new URL(name).origin === location.origin);
          registration.active?.postMessage({ type: "CACHE_URLS", urls });
        })
        .catch(() => {});
    }

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
