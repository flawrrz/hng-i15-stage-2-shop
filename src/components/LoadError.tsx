"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

/**
 * Inline "couldn't load" state for server data that failed to fetch. It sits
 * exactly where the data would have rendered (inside the layout, so the
 * header and footer stay), and retries via router.refresh(), which re-runs
 * the server fetch without a full page reload.
 *
 * Why this instead of app/error.tsx: the failure that actually occurs here
 * is the Supabase fetch inside the page's own getProducts — catching it
 * there keeps the layout, filters and surrounding page context visible, and
 * the retry only re-runs that server fetch (router.refresh(), no full page
 * reload). A route-level error boundary would swap the entire segment for a
 * generic error page instead, with no way to retry just the data load.
 */
export function LoadError({ what = "content" }: { what?: string }) {
  const router = useRouter();

  return (
    <div className="text-center py-16" role="alert">
      <div className="w-14 h-14 mx-auto mb-4 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.34 16a2 2 0 001.73 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-500 text-sm mb-1">
        We couldn&apos;t load the {what}. This is usually temporary.
      </p>
      <p className="text-xs text-gray-400 mb-5">
        Try again — if it keeps happening, the shop may be having a bad day.
      </p>
      <Button onClick={() => router.refresh()}>Try again</Button>
    </div>
  );
}
