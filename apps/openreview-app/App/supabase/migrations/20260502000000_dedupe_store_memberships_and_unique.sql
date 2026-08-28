-- ========================================
-- store_memberships: 重複削除 + UNIQUE 制約 (B + 一部 C の前提)
-- ----------------------------------------
-- 背景:
--   complete-staff-invitation は status='invited' のトークンに対し
--   並列 POST で「存在チェック → insert」を走らせていたため、
--   並列リクエスト時に同一 (business_user_id, store_id) の重複行が
--   挿入されることがあった (例: 福田社長の戸田店で 2 行重複)。
--
-- 対処:
--   1. 既存の重複行を最古 1 行残して削除
--   2. (business_user_id, store_id) に UNIQUE 制約を追加
--   3. (Edge Function 側で upsert + onConflict ignore に切替)
-- ========================================

-- ========================================
-- 1. 既存重複の削除 (最古 1 行を残し、それ以降を削除)
-- ========================================
DELETE FROM public.store_memberships sm
WHERE sm.id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY business_user_id, store_id
             ORDER BY created_at ASC, id ASC
           ) AS rn
    FROM public.store_memberships
  ) t
  WHERE t.rn > 1
);

-- ========================================
-- 2. UNIQUE 制約追加
-- ========================================
ALTER TABLE public.store_memberships
  DROP CONSTRAINT IF EXISTS store_memberships_user_store_unique;

ALTER TABLE public.store_memberships
  ADD CONSTRAINT store_memberships_user_store_unique
  UNIQUE (business_user_id, store_id);

-- ========================================
-- 3. 確認
-- ========================================
-- 重複が無いことを確認
DO $$
DECLARE
  v_dup_count int;
BEGIN
  SELECT COUNT(*)
    INTO v_dup_count
    FROM (
      SELECT business_user_id, store_id
      FROM public.store_memberships
      GROUP BY business_user_id, store_id
      HAVING COUNT(*) > 1
    ) d;
  IF v_dup_count <> 0 THEN
    RAISE EXCEPTION 'store_memberships に依然として重複が % 件残っています', v_dup_count;
  END IF;
END$$;
