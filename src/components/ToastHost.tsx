"use client";

import { useToastStore } from "@/lib/toast-store";

/**
 * Renders the toast queue (lib/toast-store.ts) as a fixed stack in the
 * bottom-right corner. Mounted once in the root layout. Clicking a toast
 * dismisses it early; each toast also expires on its own.
 */
export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => dismiss(toast.id)}
          className="animate-toast-in max-w-xs text-left bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg border border-gray-700 hover:bg-gray-800 transition-colors"
        >
          {toast.text}
          <span className="ml-2 text-gray-400" aria-hidden="true">
            ✕
          </span>
        </button>
      ))}

      <style jsx>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-toast-in {
          animation: toast-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
