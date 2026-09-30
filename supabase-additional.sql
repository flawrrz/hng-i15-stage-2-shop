-- Additional tables for newsletter and other features
-- Run this after the main schema

-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can manage subscribers
CREATE POLICY "Admins can manage newsletter subscribers"
  ON newsletter_subscribers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- ADD TRIGGER FOR UPDATED_AT ON ORDERS
-- ============================================
-- (Already covered in main schema)

-- ============================================
-- HELPER FUNCTION FOR ORDER TOTALS
-- ============================================
CREATE OR REPLACE FUNCTION get_order_total(order_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(price_at_purchase * quantity), 0)
  INTO total
  FROM order_items
  WHERE order_id = order_uuid;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW FOR ORDER DETAILS WITH ITEMS
-- ============================================
CREATE OR REPLACE VIEW order_details AS
SELECT 
  o.id,
  o.user_id,
  o.total_amount,
  o.status,
  o.shipping_address,
  o.customer_email,
  o.created_at,
  o.updated_at,
  jsonb_agg(
    jsonb_build_object(
      'id', oi.id,
      'product_id', oi.product_id,
      'quantity', oi.quantity,
      'price_at_purchase', oi.price_at_purchase,
      'product_title', p.title,
      'product_image', p.image_url
    )
  ) FILTER (WHERE oi.id IS NOT NULL) AS items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
GROUP BY o.id;

-- Grant access to authenticated users for their own orders
GRANT SELECT ON order_details TO authenticated;