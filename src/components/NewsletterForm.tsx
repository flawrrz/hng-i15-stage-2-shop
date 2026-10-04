"use client";

import { FormEvent, useState } from "react";

type Status = { kind: "success" | "error"; text: string } | null;

/**
 * Newsletter signup with inline feedback — used on the home and products
 * pages (both sit on dark sections, hence the dark styling).
 *
 * Why this exists: the previous plain HTML form posted to the API and left
 * the browser on a raw JSON page whenever the address was already
 * subscribed (a 400 response) — the most common error looked like a crash,
 * and success redirected away without any confirmation. Now every outcome
 * is a message next to the form. The action/method attributes remain as a
 * no-JavaScript fallback.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();
    if (!value || busy) return;

    setBusy(true);
    setStatus(null);

    const body = new FormData();
    body.append("email", value);

    fetch("/api/newsletter", {
      method: "POST",
      body,
      // Tells the route to answer with JSON instead of the no-JS redirect
      // (a followed redirect becomes a POST against the home page → 404).
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        // Success now arrives as an explicit 200 JSON response; the redirect
        // branch stays as a safety net for older cached responses.
        if (res.redirected || res.ok) {
          setStatus({
            kind: "success",
            text: "You're subscribed! Check your inbox for a welcome email.",
          });
          setEmail("");
          return;
        }
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        const message =
          data?.error === "Email already subscribed"
            ? "This email is already subscribed — you're on the list!"
            : data?.error || "Something went wrong — please try again.";
        setStatus({ kind: "error", text: message });
      })
      .catch((error) => {
        // Network failures must surface to the user, never vanish silently.
        console.error("Newsletter signup failed:", error);
        setStatus({ kind: "error", text: "Network error — please try again." });
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <form
        className="flex flex-col sm:flex-row gap-3"
        action="/api/newsletter"
        method="POST"
        onSubmit={handleSubmit}
      >
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          {busy ? "Subscribing…" : "Subscribe"}
        </button>
      </form>

      {/* role=status + aria-live: screen readers announce the outcome */}
      <p
        role="status"
        aria-live="polite"
        className={`text-sm mt-3 min-h-[1.25rem] ${
          status?.kind === "error" ? "text-red-300" : "text-green-300"
        }`}
      >
        {status?.text ?? ""}
      </p>
    </div>
  );
}
