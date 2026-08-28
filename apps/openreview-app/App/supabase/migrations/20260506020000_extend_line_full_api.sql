-- ===== クーポン拡張カラム (Flex Message パラメータ全網羅) =====
ALTER TABLE line_coupons
  ADD COLUMN IF NOT EXISTS bubble_size text DEFAULT 'kilo' CHECK (bubble_size IN ('nano','micro','kilo','mega','giga')),
  ADD COLUMN IF NOT EXISTS background_color text,         -- 例 '#ffffff'
  ADD COLUMN IF NOT EXISTS header_text text,              -- 例 '会員限定'
  ADD COLUMN IF NOT EXISTS header_color text,             -- header_text の色
  ADD COLUMN IF NOT EXISTS cta_label text,                -- 「クーポンを使う」など
  ADD COLUMN IF NOT EXISTS cta_uri text,                  -- ボタン押下時の URL
  ADD COLUMN IF NOT EXISTS cta_color text,                -- ボタン色
  ADD COLUMN IF NOT EXISTS start_at timestamptz;          -- 有効開始日

-- ===== メッセージブロック拡張: audio タイプ追加 + emojis (text 内絵文字) =====
ALTER TABLE line_message_blocks
  DROP CONSTRAINT IF EXISTS line_message_blocks_block_type_check;
ALTER TABLE line_message_blocks
  ADD CONSTRAINT line_message_blocks_block_type_check
  CHECK (block_type IN ('text','image','coupon','sticker','video','location','audio'));

ALTER TABLE line_message_blocks
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS audio_duration_ms integer,
  ADD COLUMN IF NOT EXISTS video_tracking_id text,        -- video の trackingId
  ADD COLUMN IF NOT EXISTS emojis jsonb;                  -- text の絵文字: [{index, productId, emojiId}]

-- ===== メッセージ全体: 集計単位 =====
ALTER TABLE line_messages
  ADD COLUMN IF NOT EXISTS custom_aggregation_units jsonb; -- 配列 (max 1)
