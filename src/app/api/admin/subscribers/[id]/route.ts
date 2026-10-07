import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

/** DELETE /api/admin/subscribers/[id] — remove one newsletter subscriber. */

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const { error: dbError } = await supabase
    .from("newsletter_subscribers")
    .delete()
    .eq("id", id);

  if (dbError) {
    console.error("admin/subscribers DELETE error:", dbError);
    return NextResponse.json(
      { error: "Could not remove the subscriber." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
