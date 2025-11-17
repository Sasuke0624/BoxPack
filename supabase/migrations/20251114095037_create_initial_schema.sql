/*
  # BOXPACK ECサイト - 初期スキーマ作成

  ## 概要
  木材箱ECサイトのデータベース構造を作成します。
  
  ## 新規テーブル
  
  ### 1. profiles
  - ユーザープロフィール情報
  - `id` (uuid, auth.usersと連携)
  - `email` (text)
  - `full_name` (text)
  - `company_name` (text)
  - `phone` (text)
  - `points` (integer, デフォルト0)
  - `created_at`, `updated_at` (timestamptz)

  ### 2. materials
  - 板材マスタ（針葉樹、ラワン、OSBなど）
  - `id` (uuid)
  - `name` (text) - 材料名
  - `description` (text) - 説明
  - `image_url` (text) - 画像URL
  - `base_price` (numeric) - 基本単価
  - `is_active` (boolean)
  - `sort_order` (integer)

  ### 3. material_thicknesses
  - 板厚と価格設定
  - `id` (uuid)
  - `material_id` (uuid)
  - `thickness_mm` (integer) - 厚み(mm)
  - `price_multiplier` (numeric) - 価格乗数
  - `is_available` (boolean)

  ### 4. options
  - オプション（ハンドル、バックル、補強板など）
  - `id` (uuid)
  - `name` (text)
  - `description` (text)
  - `price` (numeric)
  - `option_type` (text) - handle/buckle/reinforcement/express
  - `is_active` (boolean)

  ### 5. saved_templates
  - ユーザーが保存した木箱テンプレート
  - `id` (uuid)
  - `user_id` (uuid)
  - `template_name` (text)
  - `width_mm`, `depth_mm`, `height_mm` (integer)
  - `material_id`, `thickness_id` (uuid)
  - `selected_options` (jsonb)

  ### 6. orders
  - 注文情報
  - `id` (uuid)
  - `user_id` (uuid)
  - `order_number` (text, unique)
  - `status` (text) - pending/confirmed/manufacturing/shipped/delivered
  - `total_amount` (numeric)
  - `points_used` (integer)
  - `shipping_address` (jsonb)
  - `payment_method` (text)
  - `payment_status` (text)
  - `created_at`, `updated_at` (timestamptz)

  ### 7. order_items
  - 注文明細
  - `id` (uuid)
  - `order_id` (uuid)
  - `width_mm`, `depth_mm`, `height_mm` (integer)
  - `material_id`, `thickness_id` (uuid)
  - `selected_options` (jsonb)
  - `quantity` (integer)
  - `unit_price` (numeric)
  - `subtotal` (numeric)

  ## セキュリティ
  - 全テーブルでRLS有効化
  - ユーザーは自分のデータのみアクセス可能
  - 公開マスタデータは全員が読み取り可能
*/

-- profilesテーブル
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  company_name text DEFAULT '',
  phone text DEFAULT '',
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- materialsテーブル
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  base_price numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active materials"
  ON materials FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- material_thicknessesテーブル
CREATE TABLE IF NOT EXISTS material_thicknesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  thickness_mm integer NOT NULL,
  price_multiplier numeric NOT NULL DEFAULT 1.0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE material_thicknesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read available thicknesses"
  ON material_thicknesses FOR SELECT
  TO authenticated, anon
  USING (is_available = true);

-- optionsテーブル
CREATE TABLE IF NOT EXISTS options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  option_type text NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active options"
  ON options FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- saved_templatesテーブル
CREATE TABLE IF NOT EXISTS saved_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  width_mm integer NOT NULL,
  depth_mm integer NOT NULL,
  height_mm integer NOT NULL,
  material_id uuid NOT NULL REFERENCES materials(id),
  thickness_id uuid NOT NULL REFERENCES material_thicknesses(id),
  selected_options jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own templates"
  ON saved_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON saved_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON saved_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON saved_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ordersテーブル
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total_amount numeric NOT NULL DEFAULT 0,
  points_used integer DEFAULT 0,
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_method text NOT NULL DEFAULT '',
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- order_itemsテーブル
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  width_mm integer NOT NULL,
  depth_mm integer NOT NULL,
  height_mm integer NOT NULL,
  material_id uuid NOT NULL REFERENCES materials(id),
  thickness_id uuid NOT NULL REFERENCES material_thicknesses(id),
  selected_options jsonb DEFAULT '[]'::jsonb,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_material_thicknesses_material ON material_thicknesses(material_id);
CREATE INDEX IF NOT EXISTS idx_options_active ON options(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_saved_templates_user ON saved_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 初期データ投入（材料マスタ）
INSERT INTO materials (name, description, base_price, sort_order) VALUES
('針葉樹合板', '最も一般的な合板。コストパフォーマンスに優れています。', 50, 1),
('ラワン合板', '軽量で加工しやすい。内装用途に最適。', 65, 2),
('OSB合板', '構造用合板。強度が高く耐久性に優れています。', 45, 3),
('シナ合板', '表面が美しく、高級感があります。', 80, 4),
('MDF', '密度が高く表面が滑らか。塗装に適しています。', 55, 5),
('パーティクルボード', '経済的な選択肢。軽量物の梱包に。', 40, 6),
('耐水合板', '防水性能を持つ合板。屋外使用可能。', 75, 7)
ON CONFLICT DO NOTHING;

-- 初期データ投入（板厚）
DO $$
DECLARE
  material_record RECORD;
BEGIN
  FOR material_record IN SELECT id FROM materials LOOP
    INSERT INTO material_thicknesses (material_id, thickness_mm, price_multiplier) VALUES
    (material_record.id, 9, 0.9),
    (material_record.id, 12, 1.0),
    (material_record.id, 15, 1.2),
    (material_record.id, 18, 1.4),
    (material_record.id, 21, 1.6)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 初期データ投入（オプション）
INSERT INTO options (name, description, price, option_type, sort_order) VALUES
('取っ手（ハンドル）', '持ち運びに便利な取っ手を追加', 500, 'handle', 1),
('バックル金具', '蓋の固定用金具', 300, 'buckle', 2),
('補強板', '強度を高める補強材', 800, 'reinforcement', 3),
('即納オプション', '優先生産で納期短縮（+3円/mm）', 0, 'express', 4)
ON CONFLICT DO NOTHING;