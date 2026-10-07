import { deliveryFee, vatFor } from './utils';
import type { CartItem, CheckoutRequest, Product } from './types';

/**
 * Format a number as currency (2 decimal places).
 * Prices are displayed with formatNaira (lib/utils.ts) — this stays for the
 * rare non-naira number, mirroring the web app's legacy `format` helper.
 */
export function format(value: number): string {
  return value.toFixed(2);
}

/** Format an ISO date string for display. */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Shipping/tax rules — must stay identical to the web checkout
 * (src/app/checkout/page.tsx), otherwise the totals shown here wouldn't
 * match what the server records: standard delivery of ₦3,500, free at
 * ₦50,000+, plus Nigeria's 7.5% VAT on the subtotal.
 */
export function calculateTotals(subtotal: number) {
  const shipping = deliveryFee(subtotal);
  const tax = vatFor(subtotal);
  const total = subtotal + shipping + tax;
  return { shipping, tax, total };
}

/**
 * POSTs a new order to the Next.js /api/checkout route handler.
 * Throws an Error with the server's message when the order is rejected
 * (out of stock, invalid data, ...).
 */
export async function placeOrder(payload: CheckoutRequest): Promise<string> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  const response = await fetch(`${apiUrl}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let result: { orderId?: string; error?: string } = {};
  try {
    result = await response.json();
  } catch {
    // Non-JSON body (for example a hosting error page) — handled below.
    console.error('Checkout returned a non-JSON response', response.status);
  }

  if (!response.ok || !result.orderId) {
    throw new Error(result.error || 'Failed to process order. Please try again.');
  }

  return result.orderId;
}

/**
 * Subscribes an email via the web app's /api/newsletter route.
 * The route redirects on success, and fetch follows redirects, so reaching
 * this point without an error means the subscription went through.
 */
export async function subscribeToNewsletter(email: string): Promise<void> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  const body = new FormData();
  body.append('email', email);

  const response = await fetch(`${apiUrl}/api/newsletter`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    let message = 'Could not subscribe. Please try again.';
    try {
      const result = await response.json();
      if (result.error) message = result.error;
    } catch {
      // Server returned a non-JSON error body; keep the generic message.
      console.error('Newsletter returned a non-JSON error', response.status);
    }
    throw new Error(message);
  }
}

/** Builds the checkout payload exactly the way the web checkout page does. */
export function buildCheckoutPayload(options: {
  items: CartItem[];
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  subtotal: number;
}): CheckoutRequest {
  const {
    items,
    email,
    firstName,
    lastName,
    phone,
    address,
    apartment,
    city,
    state,
    zipCode,
    country,
    subtotal,
  } = options;

  const { shipping, tax, total } = calculateTotals(subtotal);

  return {
    customer: {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
    },
    shipping_address: {
      full_name: `${firstName} ${lastName}`,
      email,
      phone,
      address_line_1: address,
      address_line_2: apartment,
      city,
      state,
      postal_code: zipCode,
      country,
    },
    items: items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: item.price,
    })),
    subtotal,
    shipping,
    tax,
    total,
  };
}

/** Short order reference for display, e.g. "A1B2C3D4". */
export function shortOrderId(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

/** Loads every product, newest first — same query the web app uses. */
export async function fetchProducts(): Promise<Product[]> {
  const { supabase } = await import('./supabase');
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error('Could not load products. Pull to retry.');
  }

  return data ?? [];
}
