-- shift テーブル用のRLSポリシー
-- ユーザーが所属する店舗のシフト情報のみ閲覧・編集可能

-- 1. shift テーブルの SELECT ポリシー
-- ユーザーが所属する店舗のシフトデータのみ閲覧可能
CREATE POLICY "Users can view shifts for their stores" ON shift
    FOR SELECT 
    USING (
        store_id IN (
            SELECT sm.store_id 
            FROM store_memberships sm
            WHERE sm.business_user_id = auth.uid()
        )
    );

-- 2. shift テーブルの INSERT ポリシー
-- ユーザーが所属する店舗のシフトデータのみ作成可能
CREATE POLICY "Users can insert shifts for their stores" ON shift
    FOR INSERT 
    WITH CHECK (
        store_id IN (
            SELECT sm.store_id 
            FROM store_memberships sm
            WHERE sm.business_user_id = auth.uid()
        )
    );

-- 3. shift テーブルの UPDATE ポリシー
-- ユーザーが所属する店舗のシフトデータのみ更新可能
CREATE POLICY "Users can update shifts for their stores" ON shift
    FOR UPDATE 
    USING (
        store_id IN (
            SELECT sm.store_id 
            FROM store_memberships sm
            WHERE sm.business_user_id = auth.uid()
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT sm.store_id 
            FROM store_memberships sm
            WHERE sm.business_user_id = auth.uid()
        )
    );

-- 4. shift テーブルの DELETE ポリシー
-- ユーザーが所属する店舗のシフトデータのみ削除可能
CREATE POLICY "Users can delete shifts for their stores" ON shift
    FOR DELETE 
    USING (
        store_id IN (
            SELECT sm.store_id 
            FROM store_memberships sm
            WHERE sm.business_user_id = auth.uid()
        )
    );

-- RLSを有効化
ALTER TABLE shift ENABLE ROW LEVEL SECURITY;

-- 確認用クエリ（コメントアウト）
-- SELECT 'RLS policies for shift table created successfully!' as result;