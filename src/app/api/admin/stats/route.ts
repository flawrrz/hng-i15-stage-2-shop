import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/stats — row counts for the dashboard header.
 *
 * Service-role client because orders/subscribers are RLS-restricted to their
 * own rows for regular users, so an anon count would silently return 0.
 */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const supabase = createAdminClient();
  const [products, orders, subscribers] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true }),
  ]);

  const firstError = products.error ?? orders.error ?? subscribers.error;
  if (firstError) {
    console.error("admin/stats GET error:", firstError);
    return NextResponse.json(
      { error: "Could not load dashboard counts." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    stats: {
      products: products.count ?? 0,
      orders: orders.count ?? 0,
      subscribers: subscribers.count ?? 0,
    },
  });
}
