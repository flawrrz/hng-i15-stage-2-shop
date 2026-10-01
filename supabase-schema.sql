-- Supabase Database Schema for E-Commerce Shop
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for category filtering
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  shipping_address JSONB NOT NULL,
  customer_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user orders lookup
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase DECIMAL(10, 2) NOT NULL CHECK (price_at_purchase >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for order items lookup
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Products: Public read access
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

-- Products: Only authenticated admins can insert/update/delete
-- (You'll need to add an 'is_admin' claim or use service role for writes)
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Orders: Users can only see their own orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Orders: Users can create their own orders (checkout)
CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Order Items: Users can view items from their own orders
CREATE POLICY "Users can view their order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Order Items: Users can create items for their own orders
CREATE POLICY "Users can create order items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage newsletter subscribers"
  ON newsletter_subscribers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- RESEED DUMMY PRODUCTS (Development / Demo)
-- ============================================
-- Run this block when you want to replace old sample data.
-- It clears order records first because order_items references products.
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;

INSERT INTO products (title, description, price, stock_quantity, image_url, category) VALUES
('AeroLite Everyday Backpack', 'Water-resistant backpack with a 20L capacity, padded laptop compartment, and breathable back panel for daily commutes.', 79.99, 28, 'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=800&h=800&fit=crop', 'Accessories'),
('Nova Wireless Earbuds', 'True wireless earbuds with active noise cancellation, 32-hour battery life, and fast USB-C charging case.', 129.99, 42, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop', 'Electronics'),
('CloudSoft Knit Sweater', 'Lightweight knit sweater made from a soft cotton blend. Relaxed fit with ribbed cuffs and hem.', 54.99, 36, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=800&fit=crop', 'Clothing'),
('Terra Ceramic Dinner Set', '12-piece ceramic dinner set with a matte glaze finish. Microwave and dishwasher safe for daily use.', 94.99, 19, 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&h=800&fit=crop', 'Home'),
('Luna Glass Water Bottle', 'Durable borosilicate glass bottle with protective silicone sleeve and leak-proof bamboo lid.', 27.99, 63, 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=800&fit=crop', 'Accessories'),
('Pulse Smart Fitness Watch', 'Fitness smartwatch with heart-rate tracking, sleep analytics, GPS, and 7-day battery life.', 189.99, 22, 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&h=800&fit=crop', 'Electronics'),
('Summit Insulated Hoodie', 'Midweight fleece hoodie with brushed interior and moisture-wicking fabric for year-round comfort.', 64.99, 31, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=800&fit=crop', 'Clothing'),
('Oakwood Serving Board', 'Large acacia serving board perfect for charcuterie or prep. Includes carved side grips for easy handling.', 39.99, 27, 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=800&h=800&fit=crop', 'Home'),
('Arc LED Desk Lamp', 'Adjustable LED desk lamp with three color temperatures and touch controls for brightness levels.', 45.99, 34, 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=800&h=800&fit=crop', 'Electronics'),
('Drift Canvas Slip-Ons', 'Breathable canvas slip-on shoes with cushioned insole and flexible rubber outsole for all-day wear.', 49.99, 48, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop', 'Clothing'),
('Harbor Throw Blanket', 'Soft woven throw blanket with textured pattern and fringe edges. Great for sofa or bedroom styling.', 34.99, 40, 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&h=800&fit=crop', 'Home'),
('Orbit Magnetic Phone Stand', 'Aluminum magnetic phone stand with adjustable viewing angles and anti-slip base for desks.', 24.99, 75, 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=800&fit=crop', 'Accessories');