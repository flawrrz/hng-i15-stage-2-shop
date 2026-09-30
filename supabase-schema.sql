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
-- SEED DATA (Optional - run after table creation)
-- ============================================
INSERT INTO products (title, description, price, stock_quantity, image_url, category) VALUES
('Classic Cotton T-Shirt', 'Premium quality cotton t-shirt with a comfortable fit. Perfect for everyday wear. Made from 100% organic cotton that gets softer with every wash.', 29.99, 50, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop', 'Clothing'),
('Wireless Bluetooth Headphones', 'High-quality wireless headphones with active noise cancellation and 30-hour battery life. Features premium drivers for rich, detailed sound.', 149.99, 25, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop', 'Electronics'),
('Minimalist Leather Wallet', 'Handcrafted genuine leather wallet with RFID protection. Slim design fits in any pocket while holding up to 8 cards and cash.', 49.99, 30, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&h=800&fit=crop', 'Accessories'),
('Ceramic Coffee Mug Set', 'Set of 4 handcrafted ceramic mugs. Microwave and dishwasher safe. Each mug holds 12oz and features a comfortable handle.', 34.99, 40, 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=800&h=800&fit=crop', 'Home'),
('Stainless Steel Water Bottle', 'Insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours. Double-wall vacuum insulation prevents condensation.', 24.99, 60, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop', 'Accessories'),
('Organic Cotton Hoodie', 'Cozy organic cotton hoodie with brushed interior. Ethically manufactured in a fair-trade certified facility.', 69.99, 35, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop', 'Clothing'),
('Bamboo Cutting Board', 'Eco-friendly bamboo cutting board with juice groove. Gentle on knives and naturally antimicrobial.', 22.99, 45, 'https://images.unsplash.com/photo-1584990347449-1514a8a7377e?w=800&h=800&fit=crop', 'Home'),
('Smart Watch Series 5', 'Advanced health tracking, GPS, and cellular connectivity. Water resistant to 50m. Always-on retina display.', 399.99, 15, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop', 'Electronics');