/*
  # Inventory Management Tables
  
  This migration creates tables for inventory management:
  - inventory: Current stock levels for materials and thicknesses
  - inventory_history: History of stock movements (in/out)
*/

-- Inventory table: tracks current stock for each material-thickness combination
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  thickness_id uuid NOT NULL REFERENCES material_thicknesses(id) ON DELETE CASCADE,
  current_stock integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 10,
  unit text DEFAULT '枚',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(material_id, thickness_id)
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Inventory history table: tracks all stock movements
CREATE TABLE IF NOT EXISTS inventory_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity integer NOT NULL,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  reason text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;

-- Admin policies for inventory
CREATE POLICY "Admins can manage inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin policies for inventory_history
CREATE POLICY "Admins can manage inventory history"
  ON inventory_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_material_thickness ON inventory(material_id, thickness_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_inventory ON inventory_history(inventory_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_history_type ON inventory_history(movement_type, created_at DESC);

