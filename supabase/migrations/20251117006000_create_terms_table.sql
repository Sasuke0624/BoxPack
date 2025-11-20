/*
  # Terms of Service Table
  
  This table stores the terms of service content that can be managed by admins.
*/

CREATE TABLE IF NOT EXISTS terms_of_service (
  id text PRIMARY KEY DEFAULT 'current',
  content text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  effective_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE terms_of_service ENABLE ROW LEVEL SECURITY;

-- Anyone can read the current terms
CREATE POLICY "Anyone can read terms of service"
  ON terms_of_service FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only admins can update terms
CREATE POLICY "Admins can manage terms of service"
  ON terms_of_service FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default terms
INSERT INTO terms_of_service (id, content, version, effective_date)
VALUES (
  'current',
  '<section><h2>第1条（適用）</h2><p>本規約は、BOXPACK（以下「当サービス」）が提供するサービスの利用条件を定めるものです。利用者は、本規約に同意したものとみなされます。</p></section>
<section><h2>第2条（利用登録）</h2><p>当サービスの利用を希望する方は、本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。</p></section>
<section><h2>第3条（ユーザーIDおよびパスワードの管理）</h2><p>利用者は、自己の責任において、当サービスのユーザーIDおよびパスワードを適切に管理するものとします。</p></section>
<section><h2>第4条（禁止事項）</h2><p>利用者は、当サービスの利用にあたり、法令または公序良俗に違反する行為、犯罪行為に関連する行為、その他当社が不適切と判断する行為をしてはなりません。</p></section>
<section><h2>第5条（本サービスの提供の停止等）</h2><p>当社は、必要と判断した場合、利用者に事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p></section>
<section><h2>第6条（免責事項）</h2><p>当社は、本サービスに関して、利用者と他の利用者または第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</p></section>
<section><h2>第7条（サービス内容の変更等）</h2><p>当社は、利用者に通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによって利用者に生じた損害について一切の責任を負いません。</p></section>
<section><h2>第8条（利用規約の変更）</h2><p>当社は、必要と判断した場合には、利用者に通知することなくいつでも本規約を変更することができるものとします。変更後の本規約は、当社ウェブサイトに掲示された時点から効力を生じるものとします。</p></section>
<section><h2>第9条（準拠法・裁判管轄）</h2><p>本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</p></section>',
  1,
  CURRENT_DATE
)
ON CONFLICT (id) DO NOTHING;

