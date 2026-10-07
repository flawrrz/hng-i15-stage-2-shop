import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

/** GET /api/admin/orders — every order with its line items, newest first. */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const supabase = createAdminClient();
  const { data, error: dbError } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        id,
        quantity,
        price_at_purchase,
        products ( title )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (dbError) {
    console.error("admin/orders GET error:", dbError);
    return NextResponse.json(
      { error: "Could not load orders." },
      { status: 500 }
    );
  }

  return NextResponse.json({ orders: data ?? [] });
}
