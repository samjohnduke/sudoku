import { useEffect, useState } from "react";

export function PwaUpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Listen for the SW_UPDATED message from the service worker
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "SW_UPDATED") {
        setShowBanner(true);
      }
    }
    navigator.serviceWorker.addEventListener("message", onMessage);

    // Also check if there's already a waiting worker (e.g. user opened the
    // app while an update was already pending)
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        setShowBanner(true);
      }

      // Detect when a new SW is installed and enters waiting
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "activated" ||
            newWorker.state === "installed"
          ) {
            setShowBanner(true);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-opacity hover:opacity-90 active:opacity-80"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="animate-spin-slow"
          aria-hidden="true"
        >
          <path
            d="M14 8A6 6 0 1 1 8 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M8 0l2.5 2L8 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Update available — tap to restart
      </button>
    </div>
  );
}
