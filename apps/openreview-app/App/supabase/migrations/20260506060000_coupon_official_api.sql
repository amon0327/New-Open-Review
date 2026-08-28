ALTER TABLE line_coupons
  ADD COLUMN IF NOT EXISTS line_coupon_id text,
  ADD COLUMN IF NOT EXISTS line_coupon_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS line_coupon_sync_error text;

COMMENT ON COLUMN line_coupons.line_coupon_id IS 'LINE Messaging API で発行された公式クーポンID (POST /v2/bot/coupon の応答)';
COMMENT ON COLUMN line_coupons.line_coupon_synced_at IS 'LINE 公式 Coupon API への登録日時';
COMMENT ON COLUMN line_coupons.line_coupon_sync_error IS '同期失敗時のエラーメッセージ';
