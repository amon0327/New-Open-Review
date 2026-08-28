-- ============================================================================
-- store_memberships に name カラムを追加
-- 招待時に入力された名前をスタッフ一覧で表示するため
-- ============================================================================

ALTER TABLE store_memberships ADD COLUMN IF NOT EXISTS name TEXT;

-- 既存レコードのバックフィル: store_invitations の名前を作成順序でマッチング
WITH ranked_invitations AS (
  SELECT id, name, store_id,
    ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY created_at) as rn
  FROM store_invitations
  WHERE status = 'completed'
),
ranked_memberships AS (
  SELECT id, store_id,
    ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY created_at) as rn
  FROM store_memberships
)
UPDATE store_memberships sm
SET name = ri.name
FROM ranked_memberships rm
JOIN ranked_invitations ri ON ri.store_id = rm.store_id AND ri.rn = rm.rn
WHERE sm.id = rm.id;
