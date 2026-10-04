"use client";

import { create } from "zustand";

/**
 * Tiny toast queue for the web app — no external dependency, just enough to
 * explain cart changes the user didn't make themselves (e.g. an edit synced
 * from the mobile app, or a guest cart being merged at sign-in).
 * The mobile app mirrors this file (mobile/src/lib/toast-store.ts).
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
