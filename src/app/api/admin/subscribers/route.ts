import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

/** GET /api/admin/subscribers — newsletter list, newest first. */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const supabase = createAdminClient();
  const { data, error: dbError } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });

  if (dbError) {
    console.error("admin/subscribers GET error:", dbError);
    return NextResponse.json(
      { error: "Could not load subscribers." },
      { status: 500 }
    );
  }

  return NextResponse.json({ subscribers: data ?? [] });
}
