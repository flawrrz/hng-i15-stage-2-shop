/**
 * Money helpers — the mobile twin of the web app's src/lib/utils.ts.
 * Both apps must quote the SAME numbers (they share a cart through
 * cart-sync), so the naira format and the delivery/VAT policy live here as
 * one copy each. Keep in sync with the web file when the policy changes.
 */

/**
 * Format a price in Naira (₦12,500). Plant prices are whole-naira
 * estimates, so no kobo is shown. Mirrors web's formatNaira exactly —
 * including the en-NG locale so thousands separators match.
 */
export function formatNaira(value: number): string {
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

// ---- Delivery / tax policy (naira) -------------------------------------
// Shared by the cart, checkout and success screens so the three views can
// never disagree on what the customer owes.
export const FREE_DELIVERY_THRESHOLD = 50000; // free delivery at ₦50,000+
export const DELIVERY_FEE = 3500; // standard delivery below threshold
export const EXPRESS_DELIVERY_FEE = 7500; // express option on the web checkout
export const VAT_RATE = 0.075; // Nigeria's 7.5% VAT

/** Delivery fee for a subtotal (0 when the threshold is met). */
export function deliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

/** VAT for a subtotal. */
export function vatFor(subtotal: number): number {
  return subtotal * VAT_RATE;
}
