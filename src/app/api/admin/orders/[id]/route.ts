import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

/** PATCH /api/admin/orders/[id] — change an order's status. */

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const { id } = await params;

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status : "";
  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(", ")}.` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error: dbError } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    console.error("admin/orders PATCH error:", dbError);
    const status2 = dbError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json(
      { error: status2 === 404 ? "Order not found." : "Could not update the order." },
      { status: status2 }
    );
  }

  return NextResponse.json({ order: data });
}
