-- LINE Messaging API 連携機能の DB スキーマ
-- 企業ダッシュボードから LINE 公式アカウントに対し、アンケート回答者を絞り込んでメッセージ送信する機能

-- =========================================================================
-- 1. companies テーブルへの LINE Channel 認証情報カラム追加
--    Channel Secret / Access Token は Supabase Vault に保存し、companies には Vault の secret_id (uuid) のみ保持する
-- =========================================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS line_channel_id text,
  ADD COLUMN IF NOT EXISTS line_basic_id text,
  ADD COLUMN IF NOT EXISTS line_channel_secret_vault_id uuid,
  ADD COLUMN IF NOT EXISTS line_channel_access_token_vault_id uuid,
  ADD COLUMN IF NOT EXISTS line_messaging_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS line_messaging_updated_at timestamptz;

-- =========================================================================
-- 2. line_coupons: クーポンマスタ
--    Flex Message でクーポン UI を構築するための素材
-- =========================================================================

CREATE TABLE IF NOT EXISTS line_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  code text,
  discount_text text,
  expires_at timestamptz,
  terms_text text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_line_coupons_company ON line_coupons (company_id);
CREATE INDEX IF NOT EXISTS idx_line_coupons_active ON line_coupons (company_id, is_active);

-- =========================================================================
-- 3. line_target_segments: 保存済みターゲットフィルタ
--    conditions JSONB に store_ids[], result_types[], qsc_types[], date_range, has_comment 等を格納
-- =========================================================================

CREATE TABLE IF NOT EXISTS line_target_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_line_target_segments_company ON line_target_segments (company_id);

-- =========================================================================
-- 4. line_messages: メッセージ本体
-- =========================================================================

CREATE TABLE IF NOT EXISTS line_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','sent','failed')),
  target_segment_id uuid REFERENCES line_target_segments(id) ON DELETE SET NULL,
  target_snapshot jsonb,
  recipient_count integer,
  delivered_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_line_messages_company ON line_messages (company_id);
CREATE INDEX IF NOT EXISTS idx_line_messages_status ON line_messages (company_id, status);

-- =========================================================================
-- 5. line_message_blocks: メッセージ内のブロック (text / image / coupon)
-- =========================================================================

CREATE TABLE IF NOT EXISTS line_message_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES line_messages(id) ON DELETE CASCADE,
  block_type text NOT NULL CHECK (block_type IN ('text','image','coupon')),
  text_content text,
  image_url text,
  link_url text,
  coupon_id uuid REFERENCES line_coupons(id) ON DELETE SET NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_line_message_blocks_message ON line_message_blocks (message_id, display_order);

-- =========================================================================
-- 6. line_message_deliveries: 個別配信ログ
-- =========================================================================

CREATE TABLE IF NOT EXISTS line_message_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES line_messages(id) ON DELETE CASCADE,
  line_user_id text NOT NULL,
  user_id uuid,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_line_message_deliveries_message ON line_message_deliveries (message_id);
CREATE INDEX IF NOT EXISTS idx_line_message_deliveries_status ON line_message_deliveries (message_id, status);

-- =========================================================================
-- 7. updated_at 自動更新トリガ (汎用関数があれば再利用、なければ作成)
-- =========================================================================

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_line_coupons_updated_at ON line_coupons;
CREATE TRIGGER trg_line_coupons_updated_at
  BEFORE UPDATE ON line_coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_line_target_segments_updated_at ON line_target_segments;
CREATE TRIGGER trg_line_target_segments_updated_at
  BEFORE UPDATE ON line_target_segments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_line_messages_updated_at ON line_messages;
CREATE TRIGGER trg_line_messages_updated_at
  BEFORE UPDATE ON line_messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- =========================================================================
-- 8. Storage バケット (公開設定: LINE が画像を取得するため public 必須)
-- =========================================================================

INSERT INTO storage.buckets (id, name, public)
  VALUES ('line-message-assets', 'line-message-assets', true)
  ON CONFLICT (id) DO NOTHING;

-- バケットへのアップロードポリシー: 認証済みユーザーは自分が所属する企業のフォルダにのみアップロード可
DROP POLICY IF EXISTS "line_assets_insert_company_member" ON storage.objects;
CREATE POLICY "line_assets_insert_company_member" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'line-message-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT company_id::text FROM company_memberships WHERE business_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "line_assets_delete_company_member" ON storage.objects;
CREATE POLICY "line_assets_delete_company_member" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'line-message-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT company_id::text FROM company_memberships WHERE business_user_id = auth.uid()
    )
  );

-- public バケットのため SELECT は anon でも可 (LINE 側からの取得を許可)
DROP POLICY IF EXISTS "line_assets_public_read" ON storage.objects;
CREATE POLICY "line_assets_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'line-message-assets');

-- =========================================================================
-- 9. RLS: 全テーブル company_memberships ベースで企業単位制御
-- =========================================================================

ALTER TABLE line_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_target_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_message_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_message_deliveries ENABLE ROW LEVEL SECURITY;

-- line_coupons
DROP POLICY IF EXISTS line_coupons_select ON line_coupons;
CREATE POLICY line_coupons_select ON line_coupons FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()));

DROP POLICY IF EXISTS line_coupons_insert ON line_coupons;
CREATE POLICY line_coupons_insert ON line_coupons FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()));

DROP POLICY IF EXISTS line_coupons_update ON line_coupons;
CREATE POLICY line_coupons_update ON line_coupons FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()));

DROP POLICY IF EXISTS line_coupons_delete ON line_coupons;
CREATE POLICY line_coupons_delete ON line_coupons FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()));

-- line_target_segments
DROP POLICY IF EXISTS line_target_segments_select ON line_target_segments;
CREATE POLICY line_target_segments_select ON line_target_segments FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()));

DROP POLICY IF EXISTS line_target_segments_insert ON line_target_segments;
CREATE POLICY line_target_segments_insert ON line_target_segments FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()));

DROP POLICY IF EXISTS line_target_segments_update ON line_target_segments;
CREATE POLICY line_target_segments_update ON line_target_segments FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()));

DROP POLICY IF EXISTS line_target_segments_delete ON line_target_segments;
CREATE POLICY line_target_segments_delete ON line_target_segments FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()));

-- line_messages
DROP POLICY IF EXISTS line_messages_select ON line_messages;
CREATE POLICY line_messages_select ON line_messages FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()));

DROP POLICY IF EXISTS line_messages_insert ON line_messages;
CREATE POLICY line_messages_insert ON line_messages FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()));

DROP POLICY IF EXISTS line_messages_update ON line_messages;
CREATE POLICY line_messages_update ON line_messages FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()));

DROP POLICY IF EXISTS line_messages_delete ON line_messages;
CREATE POLICY line_messages_delete ON line_messages FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()));

-- line_message_blocks: 親 message の company_id 経由で判定
DROP POLICY IF EXISTS line_message_blocks_select ON line_message_blocks;
CREATE POLICY line_message_blocks_select ON line_message_blocks FOR SELECT TO authenticated
  USING (message_id IN (
    SELECT id FROM line_messages WHERE company_id IN (
      SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS line_message_blocks_modify ON line_message_blocks;
CREATE POLICY line_message_blocks_modify ON line_message_blocks FOR ALL TO authenticated
  USING (message_id IN (
    SELECT id FROM line_messages WHERE company_id IN (
      SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
    )
  ))
  WITH CHECK (message_id IN (
    SELECT id FROM line_messages WHERE company_id IN (
      SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
    )
  ));

-- line_message_deliveries: 読み取りは企業所属メンバーのみ、書き込みは service_role のみ
DROP POLICY IF EXISTS line_message_deliveries_select ON line_message_deliveries;
CREATE POLICY line_message_deliveries_select ON line_message_deliveries FOR SELECT TO authenticated
  USING (message_id IN (
    SELECT id FROM line_messages WHERE company_id IN (
      SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
    )
  ));
