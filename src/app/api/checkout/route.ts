import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { isEmailConfigured, sendEmail, escapeHtml } from "@/lib/email";

interface CheckoutItem {
  product_id: string;
  quantity: number;
  price_at_purchase: number;
}

interface ShippingAddress {
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

interface CheckoutRequest {
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  shipping_address: ShippingAddress;
  items: CheckoutItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

async function sendOrderConfirmationEmail(
  orderId: string,
  customerEmail: string,
  customerName: string,
  items: CheckoutItem[],
  shippingAddress: ShippingAddress,
  subtotal: number,
  shipping: number,
  tax: number,
  total: number
) {
  // Skip early so we don't render the whole receipt HTML when no credentials exist.
  if (!isEmailConfigured()) {
    console.warn("Gmail SMTP not configured, skipping email");
    return;
  }

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-weight: 500; color: #111827;">Product ID: ${item.product_id}</div>
        <div style="font-size: 14px; color: #6b7280;">Quantity: ${item.quantity}</div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827;">
        $${item.price_at_purchase.toFixed(2)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827;">
        $${(item.price_at_purchase * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background: #111827; color: white; padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Order Confirmed</h1>
          <p style="margin: 8px 0 0; opacity: 0.8;">Thank you for your order, ${escapeHtml(customerName)}!</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 32px;">
          <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600;">Order Summary</h2>
            <p style="margin: 0; color: #6b7280;">Order #${orderId.slice(0, 8).toUpperCase()}</p>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Item</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Price</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Subtotal</span>
              <span style="font-weight: 500;">$${subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Shipping</span>
              <span style="font-weight: 500;">${shipping === 0 ? "Free" : "$" + shipping.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Tax</span>
              <span style="font-weight: 500;">$${tax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: 700;">
              <span>Total</span>
              <span>$${total.toFixed(2)}</span>
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600;">Shipping Address</h3>
            <address style="margin: 0; font-style: normal; color: #374151; white-space: pre-line;">
${escapeHtml(shippingAddress.full_name)}
${escapeHtml(shippingAddress.address_line_1)}
${escapeHtml(shippingAddress.address_line_2 || "")}
${escapeHtml(shippingAddress.city)}, ${escapeHtml(shippingAddress.state)} ${escapeHtml(shippingAddress.postal_code)}
${escapeHtml(shippingAddress.country)}
            </address>
          </div>

          <!-- Next Steps -->
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px;">
            <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #0369a1;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #0369a1;">
              <li style="margin-bottom: 4px;">We'll process your order within 1-2 business days</li>
              <li style="margin-bottom: 4px;">You'll receive a shipping confirmation with tracking info</li>
              <li>Contact us at support@shop.com if you have any questions</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Shop - Quality Products Delivered</p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Gmail SMTP transport lives in src/lib/email.ts so every endpoint sends
    // mail from the same account with the same settings.
    await sendEmail({
      to: customerEmail,
      subject: `Order Confirmation #${orderId.slice(0, 8).toUpperCase()}`,
      html,
    });

    console.log("Order confirmation email sent to:", customerEmail);
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    // Don't throw - we don't want to fail the order if email fails
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();

    // Validate required fields
    if (!body.customer?.email || !body.shipping_address || !body.items?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create Supabase clients
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get authenticated user (optional - guest checkout allowed)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Verify product prices and stock
    // Use admin client so guest checkout is not blocked by products table RLS.
    const productIds = [...new Set(body.items.map((item) => item.product_id))];
    const { data: products, error: productsError } = await adminClient
      .from("products")
      .select("id, price, stock_quantity, title")
      .in("id", productIds);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return NextResponse.json(
        { error: "Failed to verify products" },
        { status: 500 }
      );
    }

    if (!products || products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products not found" },
        { status: 400 }
      );
    }

    // Verify prices match and check stock
    for (const item of body.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.product_id} not found` },
          { status: 400 }
        );
      }
      if (Math.abs(product.price - item.price_at_purchase) > 0.01) {
        return NextResponse.json(
          { error: `Price mismatch for ${product.title}` },
          { status: 400 }
        );
      }
      if (product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.title}` },
          { status: 400 }
        );
      }
    }

    // Create order using admin client (bypasses RLS for guest checkout)
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .insert({
        user_id: user?.id || null,
        total_amount: body.total,
        status: "confirmed",
        shipping_address: body.shipping_address,
        customer_email: body.customer.email,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = body.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
    }));

    const { error: itemsError } = await adminClient
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Try to clean up the order
      await adminClient.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Failed to create order items" },
        { status: 500 }
      );
    }

    // Update product stock quantities
    for (const item of body.items) {
      const product = products.find((p) => p.id === item.product_id)!;
      const newStock = product.stock_quantity - item.quantity;
      await adminClient
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", item.product_id);
    }

    // Send confirmation email (fire and forget)
    sendOrderConfirmationEmail(
      order.id,
      body.customer.email,
      `${body.customer.first_name} ${body.customer.last_name}`,
      body.items,
      body.shipping_address,
      body.subtotal,
      body.shipping,
      body.tax,
      body.total
    ).catch(console.error);

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}