-- ============================================================================
-- store_memberships に name カラムを追加
-- 招待時に入力された名前をスタッフ一覧で表示するため
-- ============================================================================

ALTER TABLE store_memberships ADD COLUMN IF NOT EXISTS name TEXT;

-- 既存レコードのバックフィル: store_invitations の名前を反映
UPDATE store_memberships sm
SET name = si.name
FROM store_invitations si
WHERE si.store_id = sm.store_id
  AND si.status = 'completed'
  AND si.name IS NOT NULL
  AND sm.name IS NULL;
