import { useEffect } from 'react';

import { stopCartSync, syncAuthChange } from '@/lib/cart-sync';
import { useAuth } from '@/lib/auth';

/**
 * Invisible glue: mounts cart sync (lib/cart-sync.ts) for as long as the app
 * is open. Renders nothing — it only wires the signed-in account to the
 * shared `cart_items` table so this app and the web shop show the same cart.
 */
export function CartSync() {
  const { loading, user } = useAuth();
  const userId = user?.id;

  // Re-runs only when the signed-in account changes. syncAuthChange is a
  // no-op for repeated events with the same user (token refreshes).
  useEffect(() => {
    if (loading) return; // wait until the restored session is known
    syncAuthChange(userId ?? null);
  }, [loading, userId]);

  // Unmount stops syncing WITHOUT clearing the cart. Sign-out — which does
  // clear — flows through syncAuthChange above, not through this cleanup.
  useEffect(() => () => stopCartSync(), []);

  return null;
}
