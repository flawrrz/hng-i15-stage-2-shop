import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { appStorage } from './storage';
import type { CartItem } from './types';

/**
 * Cart state — mirrors src/lib/cart-store.ts from the web app so both
 * platforms behave the same (increment on re-add, remove at zero, etc.).
 * Persisted to localStorage so the cart survives app restarts.
 */
interface CartState {
  items: CartItem[];
  /**
   * Account whose server cart this local cart belongs to (null = guest).
   * lib/cart-sync.ts uses it to decide between "server wins" (same account
   * again) and "merge my guest items in" (first sign-in on this device).
   */
  syncedUserId: string | null;
  /** true once persisted state has been read from storage. */
  hydrated: boolean;
  markHydrated: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  /** Replaces the whole cart. Only cart-sync should call this. */
  setItems: (items: CartItem[]) => void;
  /** Records which account the cart is synced to. Only cart-sync calls this. */
  setSyncedUserId: (userId: string | null) => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      syncedUserId: null,
      hydrated: false,

      markHydrated: () => set({ hydrated: true }),

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.product_id === item.product_id
          );
          if (existing) {
            // Cap at the product's stock level so re-adding can't exceed
            // what's for sale (99 fallback when the level is unknown — e.g.
            // a cart persisted before stock_quantity existed).
            const cap = existing.stock_quantity ?? item.stock_quantity ?? 99;
            if (existing.quantity >= cap) return {}; // already at the cap
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id
                  ? {
                      ...i,
                      quantity: Math.min(existing.quantity + 1, cap),
                      stock_quantity: item.stock_quantity ?? i.stock_quantity,
                    }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.product_id !== productId)
              : state.items.map((i) =>
                  i.product_id === productId
                    ? // Same stock cap as addItem — the "+" button stops at
                      // stock (99 fallback when the level is unknown).
                      { ...i, quantity: Math.min(quantity, i.stock_quantity ?? 99) }
                    : i
                ),
        })),

      clearCart: () => set({ items: [] }),

      setItems: (items) => set({ items }),

      setSyncedUserId: (syncedUserId) => set({ syncedUserId }),

      getSubtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'shop-cart',
      storage: createJSONStorage(() => appStorage),
      // Only cart data is persisted — functions and flags are recreated at runtime.
      partialize: (state) => ({
        items: state.items,
        syncedUserId: state.syncedUserId,
      }),
      onRehydrateStorage: () => (state) => {
        // Lets screens avoid flashing an empty cart while storage loads.
        state?.markHydrated();
      },
    }
  )
);
