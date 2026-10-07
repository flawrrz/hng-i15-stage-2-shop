"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "./Button";
import { useCartStore } from "@/lib/cart-store";
import { formatNaira, deliveryFee, FREE_DELIVERY_THRESHOLD } from "@/lib/utils";

export function CartDrawer() {
  const { isOpen, items, closeCart, removeItem, updateQuantity, getSubtotal, getItemCount } = useCartStore();
  const router = useRouter();
  /** The drawer panel — focused on open so keyboard users land inside it. */
  const panelRef = useRef<HTMLElement | null>(null);
  const subtotal = getSubtotal();
  const itemCount = getItemCount();
  const shipping = subtotal > 0 ? deliveryFee(subtotal) : 0;
  const total = subtotal + shipping;

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Escape closes the drawer: a dialog without an escape hatch traps
  // keyboard-only users behind it (WCAG 2.1.2).
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  // Focus moves into the panel when it opens and returns to whatever had
  // focus before (usually the header cart button) when it closes.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      // Real clicks/keyboard activation leave focus on the trigger, so this
      // normally restores it there. If the drawer was opened programmatically
      // (focus still on <body>, which ignores .focus()), fall back to the
      // header cart button rather than dropping focus on the document.
      const usable =
        previouslyFocused &&
        previouslyFocused !== document.body &&
        document.contains(previouslyFocused);
      const trigger = document.querySelector<HTMLElement>(
        'header button[aria-label^="Shopping cart"]'
      );
      (usable ? previouslyFocused : trigger)?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Cart Panel */}
      <aside
        ref={panelRef}
        tabIndex={-1}
        aria-modal="true"
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-xl animate-slide-in outline-none"
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Shopping Cart ({itemCount})</h2>
          <button
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Your cart is empty</h3>
              <p className="text-gray-500 text-sm mb-6">Looks like you haven&apos;t added anything yet.</p>
              <Button onClick={closeCart} variant="primary">
                Continue Shopping
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 mr-2">
                      <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                      <p className="text-sm text-gray-500">{formatNaira(item.price)}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-gray-100"
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity Selector */}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatNaira(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery</span>
              <span className="font-medium">
                {shipping === 0 ? "Free" : formatNaira(shipping)}
              </span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-gray-500 text-center">
                Add {formatNaira(FREE_DELIVERY_THRESHOLD - subtotal)} more for free delivery!
              </p>
            )}
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>{formatNaira(total)}</span>
            </div>

            <Button
              onClick={() => {
                closeCart();
                router.push("/checkout"); // client navigation: no full page reload
              }}
              className="w-full mt-2"
              size="lg"
            >
              Proceed to Checkout
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Shipping and taxes calculated at checkout
            </p>
          </div>
        )}
      </aside>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}