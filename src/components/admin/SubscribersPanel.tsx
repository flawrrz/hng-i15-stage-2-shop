"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Trash2, Users } from "lucide-react";
import { Button } from "@/components/Button";
import { formatDate } from "@/lib/utils";
import { useToastStore } from "@/lib/toast-store";

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

interface Props {
  /** Refreshes the dashboard's stat counters after a removal. */
  onChanged: () => void;
}

export function SubscribersPanel({ onChanged }: Props) {
  const pushToast = useToastStore((state) => state.push);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetches the list; every setState happens inside a promise callback so the
  // function is safe to call from the mount effect (the
  // react-hooks/set-state-in-effect rule rejects synchronous updates).
  const load = useCallback(() => {
    fetch("/api/admin/subscribers")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        setSubscribers(json.subscribers);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        console.error("subscribers load:", err);
        setLoadError(
          err instanceof Error ? err.message : "Could not load subscribers."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  /** Manual refresh with the loading state — click handlers only. */
  const retry = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (subscriber: Subscriber) => {
    if (!window.confirm(`Remove ${subscriber.email} from the list?`)) return;
    try {
      const res = await fetch(`/api/admin/subscribers/${subscriber.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      pushToast("Subscriber removed");
      setSubscribers((prev) => prev.filter((item) => item.id !== subscriber.id));
      onChanged();
    } catch (err) {
      console.error("subscriber delete:", err);
      window.alert(
        err instanceof Error ? err.message : "Could not remove the subscriber."
      );
    }
  };

  /** Client-side CSV export — no extra route needed for a one-off download. */
  const exportCsv = () => {
    const escape = (value: string) =>
      `"${value.replace(/"/g, '""')}"` ; // quote every field, double inner quotes
    const rows = [
      ["email", "subscribed_at", "status"],
      ...subscribers.map((item) => [
        item.email,
        item.subscribed_at,
        item.unsubscribed_at ? "unsubscribed" : "active",
      ]),
    ];
    const csv = rows.map((row) => row.map(escape).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gazette-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    pushToast("CSV downloaded");
  };

  if (loading) {
    return <p className="text-ink-soft text-sm py-8 text-center">Loading subscribers…</p>;
  }

  if (loadError) {
    return (
      <div className="text-center py-10 bg-white border border-line rounded-2xl">
        <Users className="w-10 h-10 text-leaf-soft mx-auto mb-3" aria-hidden="true" />
        <p className="text-ink-soft text-sm mb-4">{loadError}</p>
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={subscribers.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Export CSV
        </Button>
      </div>

      <div className="bg-white border border-line rounded-2xl divide-y divide-line overflow-hidden">
        {subscribers.length === 0 && (
          <p className="text-ink-soft text-sm text-center py-10 px-4">
            No subscribers yet — the newsletter form is on the homepage.
          </p>
        )}

        {subscribers.map((subscriber) => (
          <div
            key={subscriber.id}
            className="flex flex-wrap items-center gap-3 p-4 hover:bg-surface/60 transition-colors"
          >
            <div className="flex-1 min-w-[180px]">
              <p className="text-sm font-medium text-ink break-all">
                {subscriber.email}
              </p>
              <p className="text-xs text-ink-soft">
                Joined {formatDate(subscriber.subscribed_at)}
                {subscriber.unsubscribed_at && " · unsubscribed"}
              </p>
            </div>

            {!subscriber.unsubscribed_at && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-mint text-leaf-dark border border-leaf-soft">
                active
              </span>
            )}

            <button
              onClick={() => remove(subscriber)}
              aria-label={`Remove ${subscriber.email}`}
              className="p-2 rounded-lg text-ink-soft hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
