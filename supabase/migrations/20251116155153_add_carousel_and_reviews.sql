/*
  # Add Carousel Images and Customer Reviews tables
  
  ## 新規テーブル
  
  ### 1. carousel_images
  - `id` (uuid, primary key)
  - `image_url` (text)
  - `title` (text)
  - `description` (text)
  - `is_active` (boolean)
  - `sort_order` (integer)
  - `created_at` (timestamptz)
  
  ### 2. customer_reviews
  - `id` (uuid, primary key)
  - `name` (text)
  - `company` (text)
  - `rating` (integer)
  - `comment` (text)
  - `created_at` (timestamptz)
  
  ## セキュリティ
  - carousel_imagesは全員が読み取り可能
  - customer_reviewsは全員が読み取り可能
*/

CREATE TABLE IF NOT EXISTS carousel_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE carousel_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active carousel images"
  ON carousel_images FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON customer_reviews FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_carousel_images_active ON carousel_images(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_created ON customer_reviews(created_at DESC);

INSERT INTO carousel_images (image_url, title, description, sort_order) VALUES
('https://images.pexels.com/photos/3962286/pexels-photo-3962286.jpeg?auto=compress&cs=tinysrgb&w=1600', 'BOXPACKについて', 'サイズを入力するだけで、すぐに価格が出て注文できる新しい木箱調達体験', 1),
('https://images.pexels.com/photos/5632395/pexels-photo-5632395.jpeg?auto=compress&cs=tinysrgb&w=1600', '高品質な板材', '7種類の板材から、用途に合わせて選択できます', 2),
('https://images.pexels.com/photos/5632400/pexels-photo-5632400.jpeg?auto=compress&cs=tinysrgb&w=1600', 'すぐに見積もり', 'リアルタイムで価格計算、待ち時間なし', 3)
ON CONFLICT DO NOTHING;

INSERT INTO customer_reviews (name, company, rating, comment) VALUES
('山田太郎', '山田物流株式会社', 5, '見積もりから注文まで本当に簡単でした。これまでの面倒な手続きがいっぺんに解決しました。'),
('佐藤花子', '佐藤製造所', 5, 'サイズを入力するだけで価格が出るのは本当に便利。急ぎの案件にも対応してくれて助かります。'),
('鈴木二郎', '鈴木建設', 4, '板材の種類が豊富で選択肢が広いのがいいですね。価格もリーズナブルです。'),
('田中美咲', '田中流通', 5, '品質が高く、納期も正確です。リピート利用させていただいています。'),
('伊藤健一', '伊藤物流', 4, '以前のような手間がなくなったので、他の業務に時間を使えます。とても助かっています。')
ON CONFLICT DO NOTHING;
