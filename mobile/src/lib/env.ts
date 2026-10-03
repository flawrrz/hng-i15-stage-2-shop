/**
 * Central place for every environment variable the app reads.
 *
 * Expo inlines EXPO_PUBLIC_* variables into the bundle at build time —
 * that also means nothing here is a secret. RLS on Supabase protects the data.
 *
 * Values come from mobile/.env (see mobile/.env.example for the template).
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env in the mobile/ folder, ` +
        `fill in the values, then restart with: npx expo start --clear`
    );
  }
  return value;
}

export const SUPABASE_URL = required(
  'EXPO_PUBLIC_SUPABASE_URL',
  process.env.EXPO_PUBLIC_SUPABASE_URL
);

// Supabase renamed the "anon key" to "publishable key". Both env names are
// accepted so values can be copied straight from the web app's .env.local.
export const SUPABASE_ANON_KEY = required(
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

/** Trailing slashes would produce URLs like `https://host//api/checkout`. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

/** Checkout and newsletter calls need the Next.js API — fail with a clear message. */
export function requireApiUrl(): string {
  if (!API_URL) {
    throw new Error(
      'Missing EXPO_PUBLIC_API_URL. It must point at the deployed web app, ' +
        'for example https://your-app.vercel.app (see .env.example).'
    );
  }
  return API_URL;
}
