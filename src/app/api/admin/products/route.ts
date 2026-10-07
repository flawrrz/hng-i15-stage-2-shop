import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET  /api/admin/products      — list every product (incl. draft stock levels)
 * POST /api/admin/products      — create a product
 *
 * Every route in /api/admin repeats the allowlist check (src/lib/admin.ts)
 * even though src/proxy.ts already blocks these paths — defence in depth for
 * a service-role client that bypasses RLS.
 */

export async function GET() {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const supabase = createAdminClient();
  const { data, error: dbError } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbError) {
    console.error("admin/products GET error:", dbError);
    return NextResponse.json(
      { error: "Could not load products." },
      { status: 500 }
    );
  }

  return NextResponse.json({ products: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const price = Number(body.price);
  const stock = Number(body.stock_quantity);

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json(
      { error: "Price must be a positive number (in naira)." },
      { status: 400 }
    );
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return NextResponse.json(
      { error: "Stock quantity must be a whole number ≥ 0." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error: dbError } = await supabase
    .from("products")
    .insert({
      title,
      description:
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null,
      price,
      stock_quantity: stock,
      image_url:
        typeof body.image_url === "string" && body.image_url.trim()
          ? body.image_url.trim()
          : null,
      category:
        typeof body.category === "string" && body.category.trim()
          ? body.category.trim()
          : null,
      // care_details is JSONB; only store it when the form actually sent one
      ...(body.care_details && typeof body.care_details === "object"
        ? { care_details: body.care_details }
        : {}),
    })
    .select()
    .single();

  if (dbError) {
    console.error("admin/products POST error:", dbError);
    return NextResponse.json(
      { error: "Could not create the product." },
      { status: 500 }
    );
  }

  return NextResponse.json({ product: data }, { status: 201 });
}
