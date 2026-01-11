"use client";

import { useEffect, useRef } from "react";

export function useVisitTracker(page) {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (tracked.current) return;
    tracked.current = true;

    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : null;
    const referrer = typeof document !== "undefined" ? document.referrer : null;

    // Send visit to our API route
    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, userAgent, referrer }),
    }).catch((err) => {
      console.log("[ANALYTICS] Visit tracking failed:", err.message);
    });
  }, [page]);
}
