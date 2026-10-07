-- The Green Gazette™ — plant catalogue migration
-- Run this ONCE in the Supabase SQL Editor before seeding the new catalogue:
--   Dashboard -> SQL Editor -> paste -> Run
--
-- 1) Adds a JSONB column for plant care details (watering, sunlight, soil, names…).
-- 2) Clears the old demo catalogue (12 dummy products) and its dependent test data.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS care_details JSONB;

-- Wipe demo data. Order matters:
--   order_items references products(id) with ON DELETE RESTRICT,
--   so order_items must go before products.
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;
-- cart_items references products(id) with ON DELETE CASCADE,
-- so any cart rows pointing at demo products are removed automatically.
-- newsletter_subscribers is intentionally kept.
