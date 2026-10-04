"use client";

import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { useCartStore, type CartItem } from "@/lib/cart-store";
import { useToastStore } from "@/lib/toast-store";

/**
 * Cart sync — keeps a signed-in account's cart identical between the web app
 * and the Expo mobile app. The mobile app has a mirrored copy of this file
 * (mobile/src/lib/cart-sync.ts) — keep both in sync when changing the algorithm.
 *
 * How it works:
 * 1. Guests never enter this module — their cart stays local (zustand persist)
 *    exactly as before this feature existed.
 * 2. When a user signs in we pull their `cart_items` rows (created by
 *    supabase-cart-sync.sql), reconcile them with the local cart, then keep
 *    both sides aligned:
 *    - local edits → debounced DIFF push (upsert changed rows, delete removed
 *      ones — never a full-state delete, so a concurrent addition from another
 *      device can't be clobbered),
 *    - remote edits → realtime `postgres_changes` events trigger a pull that
 *      applies the server cart locally.
 * 3. `lastPushed` remembers what we believe the server holds. It gates the
 *    diff push (isDirty) so a pull can never overwrite unsaved local edits,
 *    and it is re-emptied when a push fails so the next change retries it.
 * 4. Signing out (or switching accounts) stops the session first, then clears
 *    the local cart so a second account on the same device never inherits it —
 *    the cart lives in the account and returns at the next sign-in.
 */

// Debounce windows: coalesce bursts of clicks into one network round-trip.
const PUSH_DEBOUNCE_MS = 300;
const PULL_DEBOUNCE_MS = 250;

/** Shape of a `cart_items` row joined with its product (see the SQL file). */
interface ServerCartRow {
  product_id: string;
  quantity: number;
  created_at: string;
  // PostgREST returns a to-one embed as an object, but the client's select
  // parser can't infer cardinality and may type it as an array — normalize
  // both shapes below rather than trust either.
  products:
    | {
        id: string;
        title: string;
        price: number | string;
        image_url: string | null;
        stock_quantity: number | string;
      }
    | {
        id: string;
        title: string;
        price: number | string;
        image_url: string | null;
        stock_quantity: number | string;
      }[]
    | null;
}

/**
 * Lazily-created browser client. It is created on first use instead of at
 * module import because this file can be evaluated during the Next.js server
 * render of client components, where the browser client (document/cookies)
 * must not be touched. Every sync session then shares one realtime connection.
 */
let client: ReturnType<typeof createClient> | null = null;

function getSupabase(): ReturnType<typeof createClient> {
  client ??= createClient();
  return client;
}

/** The currently-running sync session, if any (one user at a time). */
let session: { userId: string; stop: () => void } | null = null;

/** Union of the two carts: server lines win, plus local-only products. */
function mergeCarts(server: CartItem[], local: CartItem[]): CartItem[] {
  const serverIds = new Set(server.map((item) => item.product_id));
  return [...server, ...local.filter((item) => !serverIds.has(item.product_id))];
}

/**
 * Feed every auth-state change here (startCartAuthListener does that on web).
 * Transitions:
 * - same user → no-op, so token refreshes never restart the session
 * - signed out / different user → stop the old session AND clear the local
 *   cart (the old cart is safe on the server; the next account must not see it)
 * - signed in → start a session (a local guest cart merges into the account)
 */
export function syncAuthChange(userId: string | null): void {
  if (session?.userId === userId) return;

  if (session) {
    // Stop BEFORE clearing so no in-flight push can write the emptied cart.
    session.stop();
    session = null;
    const store = useCartStore.getState();
    store.setItems([]);
    store.setSyncedUserId(null);
  }

  if (userId) {
    session = { userId, stop: startSession(userId) };
  }
}

/**
 * Stops syncing WITHOUT touching the cart — used when the component watching
 * auth unmounts. Not a sign-out: the cart stays exactly as it is.
 */
export function stopCartSync(): void {
  session?.stop();
  session = null;
}

/**
 * Watches the browser session and forwards it to syncAuthChange().
 * Returns a cleanup that stops watching and stops any running session — the
 * next mount re-reads the session and starts a fresh one.
 */
export function startCartAuthListener(): () => void {
  let disposed = false;

  // getSession() covers "already signed in when the page loaded";
  // onAuthStateChange covers everything afterwards.
  void getSupabase()
    .auth.getSession()
    .then(({ data }) => {
      if (!disposed) syncAuthChange(data.session?.user.id ?? null);
    })
    .catch((error) => {
      console.error("Cart sync: could not read the auth session:", error);
    });

  const {
    data: { subscription },
  } = getSupabase().auth.onAuthStateChange((_event, nextSession) => {
    if (!disposed) syncAuthChange(nextSession?.user.id ?? null);
  });

  return () => {
    disposed = true;
    subscription.unsubscribe();
    stopCartSync();
  };
}

/** Starts one account's sync session. Returns a stop function. */
function startSession(userId: string): () => void {
  const supabase = getSupabase();
  const store = useCartStore;

  let disposed = false;
  let pushTimer: ReturnType<typeof setTimeout> | null = null;
  let pullTimer: ReturnType<typeof setTimeout> | null = null;
  /** Serialises pushes: a change while one push is in flight queues behind it
   *  instead of racing, so lastPushed and the server stay in the same order. */
  let pushChain: Promise<void> = Promise.resolve();
  /** What we believe the server holds. Empty until the first successful pull
   *  (and left empty when a pull/push fails — the cart then counts as "dirty"
   *  and the next interaction re-upserts everything: self-healing). */
  let lastPushed = new Map<string, number>();
  /** True while server state is being written into the store, so the store
   *  subscriber doesn't echo it straight back as a push. */
  let applyingRemote = false;
  let unsubscribeStore: (() => void) | null = null;
  let channel: ReturnType<typeof supabase.channel> | null = null;

  /** Stable fingerprint of a cart: product + quantity + price, sorted so both
   *  sides compare equal regardless of line order. Price is included so a
   *  server-side price change refreshes the local copy on the next pull. */
  const signature = (items: CartItem[]): string =>
    items
      .map((item) => `${item.product_id}:${item.quantity}:${item.price}`)
      .sort()
      .join("|");

  /** True when the local cart differs from what we believe the server holds. */
  const isDirty = (): boolean => {
    const items = store.getState().items;
    // Length catches removals (a pid in lastPushed but no longer locally);
    // the per-item check catches quantity changes and additions.
    if (items.length !== lastPushed.size) return true;
    return items.some((item) => lastPushed.get(item.product_id) !== item.quantity);
  };

  /** Loads the account cart joined with its products (display fields).
   *  Returns null on failure — most often supabase-cart-sync.sql not run yet. */
  const fetchCart = async (): Promise<CartItem[] | null> => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(
          "product_id, quantity, created_at, products(id, title, price, image_url, stock_quantity)"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const rows = (data ?? []) as ServerCartRow[];
      return rows.flatMap((row) => {
        const product = Array.isArray(row.products) ? row.products[0] : row.products;
        // Products cascade-delete with their cart rows, so this should never
        // be missing — skip defensively rather than render an empty cart line.
        if (!product) return [];
        return [
          {
            // product_id doubles as the cart-line id: there is exactly one
            // line per product, so it is unique and stable across devices.
            id: row.product_id,
            product_id: row.product_id,
            title: product.title,
            price: Number(product.price),
            image_url: product.image_url,
            stock_quantity: Number(product.stock_quantity),
            quantity: row.quantity,
          } satisfies CartItem,
        ];
      });
    } catch (error) {
      console.error(
        "Cart sync: could not load the account cart — did you run supabase-cart-sync.sql in the Supabase SQL editor?",
        error
      );
      return null;
    }
  };

  /** Writes the difference between the local cart and `lastPushed`: upserts
   *  changed/new lines, deletes removed ones. Rows another device added (not
   *  in lastPushed, not local) are never touched — that's the point of diffing. */
  const pushDiff = async (): Promise<void> => {
    if (disposed) return;
    const items = store.getState().items;
    const currentIds = new Set(items.map((item) => item.product_id));
    const changed = items.filter(
      (item) => lastPushed.get(item.product_id) !== item.quantity
    );
    const removed = [...lastPushed.keys()].filter((id) => !currentIds.has(id));
    if (changed.length === 0 && removed.length === 0) return;

    try {
      if (changed.length > 0) {
        const { error } = await supabase.from("cart_items").upsert(
          changed.map((item) => ({
            user_id: userId,
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          { onConflict: "user_id,product_id" }
        );
        if (error) throw error;
      }
      if (removed.length > 0) {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", userId)
          .in("product_id", removed);
        if (error) throw error;
      }
      // The server now holds exactly this snapshot. If the local cart changed
      // while we were writing, that change already scheduled a follow-up push
      // (the chain keeps writes ordered) and this snapshot still describes
      // what actually landed on the server.
      lastPushed = new Map(items.map((item) => [item.product_id, item.quantity]));
    } catch (error) {
      // Leave lastPushed untouched so the cart stays dirty and the next local
      // change or realtime event retries the full diff.
      console.error(
        "Cart sync: could not save cart changes — did you run supabase-cart-sync.sql?",
        error
      );
    }
  };

  const schedulePush = (): void => {
    if (disposed) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      pushTimer = null;
      pushChain = pushChain.then(pushDiff);
    }, PUSH_DEBOUNCE_MS);
  };

  /** Applies the server cart locally. Skipped while local edits are unsaved —
   *  in that case we push instead and let the resulting realtime event bring
   *  us back here once the cart is clean. */
  const runPull = async (): Promise<void> => {
    if (disposed) return;
    if (isDirty()) {
      schedulePush();
      return;
    }

    const server = await fetchCart();
    if (disposed || server === null) return;
    if (isDirty()) {
      // Local edits landed while we were fetching — push them first.
      schedulePush();
      return;
    }

    lastPushed = new Map(server.map((item) => [item.product_id, item.quantity]));
    // Signature compare is the echo guard: pulls triggered by our OWN push's
    // realtime event see an identical cart and do nothing, so the two sides
    // can't ping-pong the same change back and forth forever.
    if (signature(store.getState().items) !== signature(server)) {
      applyingRemote = true;
      try {
        store.getState().setItems(server);
      } finally {
        applyingRemote = false;
      }
      // Explain the surprise: the cart changed without the user touching it.
      // Our own push's echo never lands here — the signature guard above
      // already filtered it — so this fires only for genuinely remote edits.
      useToastStore.getState().push("Cart updated from another device");
    }
  };

  const schedulePull = (): void => {
    if (disposed) return;
    if (pullTimer) clearTimeout(pullTimer);
    pullTimer = setTimeout(() => {
      pullTimer = null;
      void runPull();
    }, PULL_DEBOUNCE_MS);
  };

  /** The persisted cart is restored asynchronously on mobile and synchronously
   *  on web (localStorage) — wait for it so the first pull reconciles against
   *  the real local cart instead of an empty one. */
  const whenHydrated = (): Promise<void> =>
    new Promise((resolve) => {
      if (store.persist.hasHydrated()) {
        resolve();
        return;
      }
      const unsubscribe = store.persist.onFinishHydration(() => {
        unsubscribe();
        resolve();
      });
    });

  /** First reconciliation with the server, then wire up the live listeners. */
  const init = async (): Promise<void> => {
    await whenHydrated();
    if (disposed) return;

    const server = await fetchCart();
    if (disposed) return;

    if (server === null) {
      // Keep the local cart and lastPushed empty: the cart counts as dirty,
      // so the next local change re-upserts everything (self-healing once
      // the table exists). fetchCart already logged the actionable error.
    } else {
      const state = store.getState();
      const alreadySynced = state.syncedUserId === userId;
      // Remember the server state BEFORE touching the store.
      lastPushed = new Map(server.map((item) => [item.product_id, item.quantity]));

      // First sign-in for this account: keep the guest cart and add it to the
      // account cart (server lines win on conflict). Restart: the server copy
      // wins so removals made on the other device aren't resurrected locally.
      const next = alreadySynced ? server : mergeCarts(server, state.items);

      // Tell the user when this reconcile visibly changes the cart: a guest
      // cart merging into the account, account items arriving on a new
      // device, or edits made elsewhere while this session was closed.
      const changedVisibly = signature(state.items) !== signature(next);

      applyingRemote = true;
      try {
        state.setItems(next);
      } finally {
        applyingRemote = false;
      }
      store.getState().setSyncedUserId(userId); // only after a successful pull

      if (changedVisibly) {
        useToastStore
          .getState()
          .push(
            alreadySynced
              ? "Cart updated from another device"
              : "Your cart was synced to your account"
          );
      }

      if (!alreadySynced) schedulePush(); // upload local-only guest extras
    }

    if (disposed) return;

    // Live sync starts only after the initial reconcile, so an early local
    // edit can't race the first pull.
    unsubscribeStore = store.subscribe((state, previous) => {
      if (state.items === previous.items || applyingRemote) return;
      schedulePush();
    });

    channel = supabase
      .channel(`cart-sync:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cart_items",
          filter: `user_id=eq.${userId}`,
        },
        () => schedulePull()
      )
      .subscribe((status) => {
        // Fires on first join AND after a reconnect (sleep, network drop) —
        // pull then, because events may have been missed while we were away.
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) schedulePull();
        if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
          console.error(
            "Cart sync: realtime connection failed; changes will sync after it reconnects."
          );
        }
      });
  };

  void init().catch((error) => {
    console.error("Cart sync: initial sync failed:", error);
  });

  return () => {
    disposed = true;
    if (pushTimer) clearTimeout(pushTimer);
    if (pullTimer) clearTimeout(pullTimer);
    unsubscribeStore?.();
    if (channel) void supabase.removeChannel(channel);
  };
}
