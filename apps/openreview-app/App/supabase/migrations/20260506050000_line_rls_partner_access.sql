-- 既存の user_can_access_company(check_company_id uuid) 関数を使う形で
-- line_* テーブルの RLS を partner_memberships 経由でも許可するように更新

-- ========== line_coupons ==========
DROP POLICY IF EXISTS line_coupons_select ON line_coupons;
CREATE POLICY line_coupons_select ON line_coupons FOR SELECT TO authenticated
  USING (user_can_access_company(company_id));
DROP POLICY IF EXISTS line_coupons_insert ON line_coupons;
CREATE POLICY line_coupons_insert ON line_coupons FOR INSERT TO authenticated
  WITH CHECK (user_can_access_company(company_id));
DROP POLICY IF EXISTS line_coupons_update ON line_coupons;
CREATE POLICY line_coupons_update ON line_coupons FOR UPDATE TO authenticated
  USING (user_can_access_company(company_id))
  WITH CHECK (user_can_access_company(company_id));
DROP POLICY IF EXISTS line_coupons_delete ON line_coupons;
CREATE POLICY line_coupons_delete ON line_coupons FOR DELETE TO authenticated
  USING (user_can_access_company(company_id));

-- ========== line_target_segments ==========
DROP POLICY IF EXISTS line_target_segments_select ON line_target_segments;
CREATE POLICY line_target_segments_select ON line_target_segments FOR SELECT TO authenticated
  USING (user_can_access_company(company_id));
DROP POLICY IF EXISTS line_target_segments_insert ON line_target_segments;
CREATE POLICY line_target_segments_insert ON line_target_segments FOR INSERT TO authenticated
  WITH CHECK (user_can_access_company(company_id));
DROP POLICY IF EXISTS line_target_segments_update ON line_target_segments;
CREATE POLICY line_target_segments_update ON line_target_segments FOR UPDATE TO authenticated
  USING (user_can_access_company(company_id))
  WITH CHECK (user_can_access_company(company_id));
DROP POLICY IF EXISTS line_target_segments_delete ON line_target_segments;
CREATE POLICY line_target_segments_delete ON line_target_segments FOR DELETE TO authenticated
  USING (user_can_access_company(company_id));

-- ========== line_messages ==========
DROP POLICY IF EXISTS line_messages_select ON line_messages;
CREATE POLICY line_messages_select ON line_messages FOR SELECT TO authenticated
  USING (user_can_access_company(company_id));
DROP POLICY IF EXISTS line_messages_insert ON line_messages;
CREATE POLICY line_messages_insert ON line_messages FOR INSERT TO authenticated
  WITH CHECK (user_can_access_company(company_id));
DROP POLICY IF EXISTS line_messages_update ON line_messages;
CREATE POLICY line_messages_update ON line_messages FOR UPDATE TO authenticated
  USING (user_can_access_company(company_id))
  WITH CHECK (user_can_access_company(company_id));
DROP POLICY IF EXISTS line_messages_delete ON line_messages;
CREATE POLICY line_messages_delete ON line_messages FOR DELETE TO authenticated
  USING (user_can_access_company(company_id));

-- ========== line_message_blocks (親 message 経由) ==========
DROP POLICY IF EXISTS line_message_blocks_select ON line_message_blocks;
CREATE POLICY line_message_blocks_select ON line_message_blocks FOR SELECT TO authenticated
  USING (message_id IN (
    SELECT id FROM line_messages WHERE user_can_access_company(company_id)
  ));
DROP POLICY IF EXISTS line_message_blocks_modify ON line_message_blocks;
CREATE POLICY line_message_blocks_modify ON line_message_blocks FOR ALL TO authenticated
  USING (message_id IN (
    SELECT id FROM line_messages WHERE user_can_access_company(company_id)
  ))
  WITH CHECK (message_id IN (
    SELECT id FROM line_messages WHERE user_can_access_company(company_id)
  ));

-- ========== line_message_deliveries (read only) ==========
DROP POLICY IF EXISTS line_message_deliveries_select ON line_message_deliveries;
CREATE POLICY line_message_deliveries_select ON line_message_deliveries FOR SELECT TO authenticated
  USING (message_id IN (
    SELECT id FROM line_messages WHERE user_can_access_company(company_id)
  ));

-- ========== storage.objects (line-message-assets バケット) ==========
DROP POLICY IF EXISTS "line_assets_insert_company_member" ON storage.objects;
CREATE POLICY "line_assets_insert_company_member" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'line-message-assets'
    AND user_can_access_company(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "line_assets_delete_company_member" ON storage.objects;
CREATE POLICY "line_assets_delete_company_member" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'line-message-assets'
    AND user_can_access_company(((storage.foldername(name))[1])::uuid)
  );
