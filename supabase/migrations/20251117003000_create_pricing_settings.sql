/*
  # Pricing Settings Table
  
  This table stores global pricing settings for express delivery and bulk discounts.
*/

CREATE TABLE IF NOT EXISTS pricing_settings (
  id text PRIMARY KEY DEFAULT 'default',
  express_rate_per_mm numeric NOT NULL DEFAULT 3.0,
  bulk_discount_threshold integer NOT NULL DEFAULT 10,
  bulk_discount_percent numeric NOT NULL DEFAULT 5.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read and update pricing settings
CREATE POLICY "Admins can manage pricing settings"
  ON pricing_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO pricing_settings (id, express_rate_per_mm, bulk_discount_threshold, bulk_discount_percent)
VALUES ('default', 3.0, 10, 5.0)
ON CONFLICT (id) DO NOTHING;

