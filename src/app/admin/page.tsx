import { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/Button";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getCurrentUser, isAdminEmail } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin - The Green Gazette™",
  // Keeps the admin surface out of search engines (it's allowlist-gated,
  // but robots shouldn't even knock).
  robots: { index: false, follow: false },
};

/**
 * Admin console: products CRUD, order status, newsletter subscribers.
 *
 * Access is gated twice: src/proxy.ts blocks /admin before the request
 * reaches this component, and this server component re-checks the allowlist
 * (ADMIN_EMAILS) as defence in depth before rendering any admin data UI.
 */
export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!isAdminEmail(user?.email)) {
    // If the proxy let them through, the env var is missing/misconfigured —
    // say so instead of pretending the page doesn't exist.
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-line rounded-3xl p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-sun mx-auto mb-4" aria-hidden="true" />
          <h1 className="font-display text-2xl text-ink mb-2">Not authorized</h1>
          <p className="text-ink-soft text-sm mb-6">
            Admin access is limited to the emails listed in the{" "}
            <code className="bg-surface px-1.5 py-0.5 rounded">ADMIN_EMAILS</code>{" "}
            environment variable. If that should be you, add your address to{" "}
            <code className="bg-surface px-1.5 py-0.5 rounded">.env.local</code>{" "}
            (and to Vercel&apos;s environment variables), then restart the dev
            server.
          </p>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Back to the shop
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <AdminDashboard email={user!.email!} />;
}
