import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';
import { appStorage } from './storage';

/**
 * Supabase client for the mobile app.
 * Same project as the web app — the two share the products, orders and
 * newsletter tables (protected by Row Level Security).
 *
 * Notes on the options below:
 * - `storage`: localStorage (backed by expo-sqlite on native) so the user
 *   stays signed in between app launches.
 * - `detectSessionInUrl: false`: native apps have no browser URL bar, so the
 *   session is read from OAuth/email deep links manually in lib/auth.tsx.
 * - `autoRefreshToken`: tokens refresh while the app is in the foreground
 *   (paused in the background by the AppState listener further down).
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: appStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Follow Supabase's Expo guide: only auto-refresh tokens while the app is
// active — refreshing in the background drains battery for no benefit.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
