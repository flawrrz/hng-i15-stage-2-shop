/**
 * Utility functions
 */

/**
 * Format a number as currency (2 decimal places).
 * Kept for backward compatibility — prefer formatNaira for display.
 */
export function format(value: number): string {
  return value.toFixed(2);
}

/**
 * Format a price in Naira (₦12,500). Plant prices are whole-naira
 * estimates, so no kobo is shown.
 */
export function formatNaira(value: number): string {
  return `₦${Math.round(value).toLocaleString("en-NG")}`;
}

// ---- Delivery / tax policy (naira) -------------------------------------
// Shared by CartDrawer, /checkout and /checkout/success so the three
// views can never disagree on what the customer owes.
export const FREE_DELIVERY_THRESHOLD = 50000; // free delivery at ₦50,000+
export const DELIVERY_FEE = 3500;             // standard delivery below threshold
export const EXPRESS_DELIVERY_FEE = 7500;     // express option on /checkout
export const VAT_RATE = 0.075;                // Nigeria's 7.5% VAT

/** Delivery fee for a subtotal (0 when the threshold is met). */
export function deliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

/** VAT for a subtotal. */
export function vatFor(subtotal: number): number {
  return subtotal * VAT_RATE;
}

/**
 * Format a date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Classnames utility (simple version)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}