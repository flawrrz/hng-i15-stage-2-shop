import { create } from 'zustand';

/**
 * Tiny toast queue for sync feedback — no external dependency, just enough
 * to explain cart changes the user didn't make themselves (an edit synced
 * from the web app, or a guest cart being merged at sign-in).
 * Mirrors src/lib/toast-store.ts from the web app.
 */
export interface ToastMessage {
  id: number;
  text: string;
}

interface ToastState {
  toasts: ToastMessage[];
  /** Queues a toast. Identical text already on screen is not repeated, so a
   *  burst of realtime sync events produces one message, not five. */
  push: (text: string) => void;
  dismiss: (id: number) => void;
}

const TOAST_LIFETIME_MS = 4500;
let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  push: (text) => {
    if (get().toasts.some((toast) => toast.text === text)) return;
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, text }] }));
    setTimeout(() => get().dismiss(id), TOAST_LIFETIME_MS);
  },

  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
