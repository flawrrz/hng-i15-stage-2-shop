/**
 * Type definitions for the e-commerce shop
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
  /** Plant care metadata (watering, sunlight, soil, names…), stored as JSONB.
   *  Absent on rows created before the Green Gazette migration. */
  care_details?: CareDetails | null;
}

/** Plant care facts sourced from the Perenual API. Every field is optional —
 *  the API omits values it doesn't have for a species. */
export interface CareDetails {
  scientific_name?: string;
  other_names?: string[];
  type?: string;
  origin?: string[];
  cycle?: string;
  watering?: string;
  watering_benchmark?: string;
  sunlight?: string[];
  soil?: string[];
  care_level?: string;
  maintenance?: string;
  growth_rate?: string;
  hardiness?: string | { min?: string; max?: string };
  indoor?: boolean;
  poisonous_to_pets?: boolean;
  poisonous_to_humans?: boolean;
  flowering_season?: string;
  description_source?: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  shipping_address: ShippingAddress;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product?: Product; // Populated when joining
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

export interface CartItem {
  id: string;
  product_id: string;
  title: string;
  price: number;
  image_url: string | null;
  quantity: number;
  /** Optional: stock level used to cap quantities (see lib/cart-store.ts). */
  stock_quantity?: number;
}

export interface CheckoutData {
  shipping_address: ShippingAddress;
  cart_items: CartItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
}