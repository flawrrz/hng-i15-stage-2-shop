import { createClient } from "@/lib/supabase/server";
import { AccountPage } from "@/components/AccountPage";
import { redirect } from "next/navigation";

export default async function AccountPageWrapper() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/account");
  }

  // Fetch user's orders
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (title, image_url)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // User is guaranteed to exist here, and email will be present for OAuth users
  const userWithEmail = {
    ...user,
    email: user.email || "",
  };

  return <AccountPage user={userWithEmail} orders={orders || []} />;
}