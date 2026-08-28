-- LINE 公式 Coupon API スキーマに準拠したカラムを追加
ALTER TABLE line_coupons
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS reward_type text DEFAULT 'discount' CHECK (reward_type IN ('discount','cashBack','free','gift','others')),
  ADD COLUMN IF NOT EXISTS reward_price_info_type text CHECK (reward_price_info_type IN ('fixed','percentage')),
  ADD COLUMN IF NOT EXISTS reward_fixed_amount numeric,
  ADD COLUMN IF NOT EXISTS reward_percentage numeric,
  ADD COLUMN IF NOT EXISTS reward_currency text DEFAULT 'JPY',
  ADD COLUMN IF NOT EXISTS acquisition_type text DEFAULT 'normal' CHECK (acquisition_type IN ('normal','lottery')),
  ADD COLUMN IF NOT EXISTS acquisition_lottery_probability numeric,
  ADD COLUMN IF NOT EXISTS acquisition_max_acquire_count integer,
  ADD COLUMN IF NOT EXISTS coupon_timezone text DEFAULT 'ASIA_TOKYO',
  ADD COLUMN IF NOT EXISTS max_use_count_per_ticket integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'UNLISTED' CHECK (visibility IN ('UNLISTED','PUBLIC')),
  ADD COLUMN IF NOT EXISTS max_ticket_per_user integer,
  ADD COLUMN IF NOT EXISTS usage_condition text;

-- 既存 name → title へバックフィル
UPDATE line_coupons SET title = name WHERE title IS NULL AND name IS NOT NULL;

COMMENT ON COLUMN line_coupons.title IS 'LINE Coupon API: title (必須)';
COMMENT ON COLUMN line_coupons.reward_type IS 'LINE Coupon API: reward.type (discount/cashBack/free/gift/others)';
COMMENT ON COLUMN line_coupons.reward_price_info_type IS 'LINE Coupon API: reward.priceInfo.type (fixed/percentage)';
COMMENT ON COLUMN line_coupons.acquisition_type IS 'LINE Coupon API: acquisitionCondition.type (normal/lottery)';
COMMENT ON COLUMN line_coupons.visibility IS 'LINE Coupon API: visibility (UNLISTED/PUBLIC)';
COMMENT ON COLUMN line_coupons.max_use_count_per_ticket IS 'LINE Coupon API: 1=1回のみ / -1=無制限';
