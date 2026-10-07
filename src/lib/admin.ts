import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Admin access control.
 *
 * The allowlist lives in the ADMIN_EMAILS env var (comma-separated emails).
 * src/proxy.ts (middleware) blocks the /admin and /api/admin routes in front
 * of everything; these helpers repeat the check inside each admin API route
 * as defence in depth (a matcher that misses, a direct invocation, etc.).
 */

/** Returns true when the email is listed in ADMIN_EMAILS (case-insensitive). */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

/** Resolves the caller's user from the request cookies, or null. */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
        ) {
          // Route handlers only read the session here; cookie refresh is
          // handled by the middleware, so setting is intentionally skipped.
          try {
            cookiesToSet.forEach(({ name, value }) =>
              cookieStore.set(name, value)
            );
          } catch {
            // Called from a Server Component — ignore, middleware will refresh.
          }
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Gate for admin API routes: resolves the user and checks the allowlist.
 * Returns `{ user: null, error }` when access is denied — spread `error`
 * straight into the NextResponse to keep every route's check to two lines.
 */
export async function requireAdmin(): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; error: null }
  | { user: null; error: { status: number; message: string } }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      error: { status: 401, message: "Sign in to use the admin API." },
    };
  }
  if (!isAdminEmail(user.email)) {
    return {
      user: null,
      error: { status: 403, message: "Not authorized for admin access." },
    };
  }
  return { user, error: null };
}
