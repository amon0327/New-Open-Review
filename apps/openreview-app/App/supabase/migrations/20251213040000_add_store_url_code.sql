-- ============================================================================
-- 店舗にユニークなURLコードを追加
-- https://reviewform.openreview.jp/s/{store_url_code} でアクセス可能に
-- ============================================================================

-- 1. store_url_code カラムを追加
ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_url_code TEXT UNIQUE;

-- 2. 既存の店舗にランダムなコードを生成
UPDATE stores
SET store_url_code = LOWER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FOR 8))
WHERE store_url_code IS NULL;

-- 3. NOT NULL制約を追加
ALTER TABLE stores ALTER COLUMN store_url_code SET NOT NULL;

-- 4. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_stores_store_url_code ON stores(store_url_code);

-- 5. コメント
COMMENT ON COLUMN stores.store_url_code IS '店舗のユニークURLコード。https://reviewform.openreview.jp/s/{code} でアクセス';

-- ============================================================================
-- 店舗作成時に自動でstore_url_codeを生成するトリガー
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_store_url_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- コードが指定されていない場合のみ生成
  IF NEW.store_url_code IS NULL OR NEW.store_url_code = '' THEN
    LOOP
      -- 8文字のランダムコードを生成
      new_code := LOWER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FOR 8));

      -- 重複チェック
      SELECT EXISTS(SELECT 1 FROM stores WHERE store_url_code = new_code) INTO code_exists;

      -- 重複がなければループを抜ける
      EXIT WHEN NOT code_exists;
    END LOOP;

    NEW.store_url_code := new_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS store_url_code_trigger ON stores;
CREATE TRIGGER store_url_code_trigger
  BEFORE INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION generate_store_url_code();
