/**
 * Type definitions shared across the app.
 * These mirror src/lib/types.ts in the Next.js web app because both apps
 * read from the same Supabase tables.
 */

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  title: string;
  price: number;
  image_url: string | null;
  quantity: number;
  /**
   * Stock level of the product — carts cap quantities at it so you can't
   * add more than exists. Optional because carts persisted before this
   * field existed won't have it (those fall back to a 99 ceiling).
   */
  stock_quantity?: number;
}

export interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: ShippingAddress;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
}

/**
 * Shape returned by the Supabase query in the account screen:
 * `select("*, order_items(*, products(title, image_url))")`.
 * Embedded to-many relations come back as arrays (or null when empty).
 */
export interface OrderWithItems extends Order {
  order_items:
    | (OrderItem & {
        products: { title: string; image_url: string | null } | null;
      })[]
    | null;
}

/** Body POSTed to the web app's /api/checkout route handler. */
export interface CheckoutRequest {
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  shipping_address: ShippingAddress;
  items: {
    product_id: string;
    quantity: number;
    price_at_purchase: number;
  }[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}
