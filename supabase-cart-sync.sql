-- Cart sync: lets a signed-in user's cart follow their account across the
-- web app and the mobile app (both apps read/write this table and listen for
-- realtime changes). Run this in the Supabase SQL Editor AFTER supabase-schema.sql:
-- https://supabase.com/dashboard/project/_/sql/new

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CART ITEMS TABLE
-- ============================================
-- Only quantities live here — titles/prices/images are joined from products
-- on read, so the cart never shows stale product data.
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One row per product per user. This is the conflict target the apps use
  -- when upserting ("onConflict: user_id,product_id").
  UNIQUE (user_id, product_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
-- No policies for the anon role: carts only sync for signed-in accounts.
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own cart" ON cart_items;
CREATE POLICY "Users can view their own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert into their own cart" ON cart_items;
CREATE POLICY "Users can insert into their own cart"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own cart" ON cart_items;
CREATE POLICY "Users can update their own cart"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from their own cart" ON cart_items;
CREATE POLICY "Users can delete from their own cart"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Keep updated_at fresh (function comes from supabase-schema.sql).
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- REALTIME
-- ============================================
-- DELETE events read the row's OLD tuple from WAL, which by default contains
-- only the primary key. The apps filter events with user_id=eq.<uid> (and
-- realtime re-checks RLS against that old row), so without the full old row
-- every DELETE would be silently dropped — cart removals would never reach
-- the other device until a reload. FULL makes the whole row available.
-- Safe to re-run; extra WAL cost is negligible for a cart-sized table.
ALTER TABLE cart_items REPLICA IDENTITY FULL;

-- Publish the table so both apps receive INSERT/UPDATE/DELETE events and can
-- refresh their cart within about a second. Skip silently if it's already a
-- member (safe to re-run this file).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'cart_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;
  END IF;
END $$;
