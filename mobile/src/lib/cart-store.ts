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
  /** true once persisted state has been read from storage. */
  hydrated: boolean;
  markHydrated: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,

      markHydrated: () => set({ hydrated: true }),

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.product_id === item.product_id
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id
                  ? { ...i, quantity: i.quantity + 1 }
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
                    ? { ...i, quantity: Math.min(quantity, 99) }
                    : i
                ),
        })),

      clearCart: () => set({ items: [] }),

      getSubtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'shop-cart',
      storage: createJSONStorage(() => appStorage),
      // Only items are persisted — functions and flags are recreated at runtime.
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        // Lets screens avoid flashing an empty cart while storage loads.
        state?.markHydrated();
      },
    }
  )
);
