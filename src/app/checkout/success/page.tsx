import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/Button";
import { CheckCircle, Package, Truck, Mail } from "lucide-react";
import { formatDate, formatNaira, deliveryFee, vatFor } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ orderId?: string }>;
}

/** order_items row joined with its product (Supabase returns `products`). */
type SuccessOrderItem = {
  id: string;
  quantity: number;
  price_at_purchase: number;
  products?: { title: string; image_url: string | null } | null;
};

async function getOrderDetails(orderId: string) {
  const supabase = await createClient();
  
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (title, image_url)
      )
    `)
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Error fetching order:", error);
    return null;
  }

  return order;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { orderId } = await searchParams;
  
  if (!orderId) {
    return { title: "Order Confirmation - The Green Gazette™" };
  }

  return {
    title: `Order Confirmed #${orderId.slice(0, 8).toUpperCase()} - The Green Gazette™`,
    description: "Your order has been confirmed. Thank you for shopping with us!",
  };
}

export default async function SuccessPage({ searchParams }: Props) {
  const { orderId } = await searchParams;

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-leaf mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-ink mb-2">Order Confirmed</h1>
          <p className="text-ink-soft mb-6">Thank you for your order!</p>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  const order = await getOrderDetails(orderId);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-ink mb-2">Order Not Found</h1>
          <p className="text-ink-soft mb-6">We couldn&apos;t find that order. Please check your email for the confirmation.</p>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = order.order_items.reduce(
    (sum: number, item: SuccessOrderItem) => sum + item.price_at_purchase * item.quantity,
    0
  );
  // Recomputed with the same shared helpers as /checkout so the totals match.
  const shipping = deliveryFee(subtotal);
  const tax = vatFor(subtotal);
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-surface py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-mint rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-leaf" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mb-2">Order Confirmed!</h1>
          <p className="text-lg text-ink-soft">Thank you for your order, {order.shipping_address.full_name}.</p>
          <p className="text-ink-soft mt-1">Order <span className="font-mono font-medium text-ink">#{order.id.slice(0, 8).toUpperCase()}</span> placed on {formatDate(order.created_at)}</p>
        </div>

        {/* Status & Email Notice */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl border border-line p-6 text-center">
            <div className="w-12 h-12 bg-mint rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-leaf-dark" />
            </div>
            <h3 className="font-semibold text-ink mb-1">Order Confirmed</h3>
            <p className="text-sm text-ink-soft">We&apos;ve received your order</p>
          </div>
          <div className="bg-white rounded-xl border border-line p-6 text-center">
            <div className="w-12 h-12 bg-sun rounded-full flex items-center justify-center mx-auto mb-3">
              <Truck className="w-6 h-6 text-ink" />
            </div>
            <h3 className="font-semibold text-ink mb-1">Processing Soon</h3>
            <p className="text-sm text-ink-soft">We&apos;ll pack and ship within 1-2 days</p>
          </div>
          <div className="bg-white rounded-xl border border-line p-6 text-center">
            <div className="w-12 h-12 bg-leaf rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-ink mb-1">Confirmation Sent</h3>
            <p className="text-sm text-ink-soft">Check your email for details</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl border border-line overflow-hidden">
          {/* Order Items */}
          <div className="p-6 border-b border-line">
            <h2 className="text-lg font-semibold text-ink mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.order_items.map((item: SuccessOrderItem) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-surface">
                    {item.products?.image_url ? (
                      <img src={item.products.image_url} alt={item.products.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink">{item.products?.title || "Product"}</p>
                    <p className="text-sm text-ink-soft">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-ink">{formatNaira(item.price_at_purchase * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-6 bg-surface">
            <h2 className="text-lg font-semibold text-ink mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-medium">{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Delivery</span>
                <span className="font-medium">{shipping === 0 ? "Free" : formatNaira(shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Tax (7.5%)</span>
                <span className="font-medium">{formatNaira(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-3 border-t border-line">
                <span>Total</span>
                <span>{formatNaira(total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-6 border-t border-line">
            <h2 className="text-lg font-semibold text-ink mb-4">Shipping Address</h2>
            <address className="text-ink-soft not-italic whitespace-pre-line">
{order.shipping_address.full_name}
{order.shipping_address.address_line_1}
{order.shipping_address.address_line_2 || ""}
{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
{order.shipping_address.country}
            </address>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-mint border border-leaf-soft rounded-xl p-6">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Truck className="w-5 h-5 text-leaf-dark" />
            What Happens Next
          </h3>
          <ol className="space-y-2 text-sm text-ink-soft">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-leaf text-white text-xs font-bold rounded-full">1</span>
              <span>We&apos;ll process your order within 1-2 business days</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-leaf text-white text-xs font-bold rounded-full">2</span>
              <span>You&apos;ll receive a delivery confirmation email with tracking information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-leaf text-white text-xs font-bold rounded-full">3</span>
              <span>Your order will be delivered to the address above</span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/account">
            <Button variant="outline" className="w-full sm:w-auto">
              View Order History
            </Button>
          </Link>
          <Link href="/products">
            <Button className="w-full sm:w-auto">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}