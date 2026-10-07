import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * PUT    /api/admin/products/[id] — update a product (partial body)
 * DELETE /api/admin/products/[id] — delete a product
 */

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Only whitelisted columns are ever written — whatever else the client sent
  // is ignored, so a crafted request can't touch id/created_at.
  const patch: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
    }
    patch.title = title;
  }
  if (body.description !== undefined) {
    patch.description = body.description ? String(body.description).trim() : null;
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Price must be ≥ 0." }, { status: 400 });
    }
    patch.price = price;
  }
  if (body.stock_quantity !== undefined) {
    const stock = Number(body.stock_quantity);
    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { error: "Stock quantity must be a whole number ≥ 0." },
        { status: 400 }
      );
    }
    patch.stock_quantity = stock;
  }
  if (body.image_url !== undefined) {
    patch.image_url = body.image_url ? String(body.image_url).trim() : null;
  }
  if (body.category !== undefined) {
    patch.category = body.category ? String(body.category).trim() : null;
  }
  if (body.care_details !== undefined) {
    if (body.care_details && typeof body.care_details === "object") {
      patch.care_details = body.care_details;
    } else {
      patch.care_details = null;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update." },
      { status: 400 }
    );
  }
  patch.updated_at = new Date().toISOString();

  const supabase = createAdminClient();
  const { data, error: dbError } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    console.error("admin/products PUT error:", dbError);
    // PGRST116 = no row matched the id
    const status = dbError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json(
      { error: status === 404 ? "Product not found." : "Could not update the product." },
      { status }
    );
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const { error: dbError } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (dbError) {
    console.error("admin/products DELETE error:", dbError);
    // order_items.product_id is ON DELETE RESTRICT: refuse (23503) when the
    // plant appears in someone's order history.
    if (dbError.code === "23503") {
      return NextResponse.json(
        { error: "This plant belongs to an order — set it out of stock instead of deleting." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Could not delete the product." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
