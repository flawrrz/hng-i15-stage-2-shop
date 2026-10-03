"use client";

import { useEffect } from "react";

import { startCartAuthListener } from "@/lib/cart-sync";

/**
 * Invisible glue: mounts cart sync for the lifetime of the app. Renders
 * nothing — it only wires the signed-in account to the shared `cart_items`
 * table so this site and the mobile app show the same cart.
 */
export function CartSync() {
  // The listener owns its own lifecycle: unmount stops watching auth and
  // stops any running sync session (without clearing the cart).
  useEffect(() => startCartAuthListener(), []);
  return null;
}
