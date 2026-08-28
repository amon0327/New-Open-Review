-- 店舗に紐付いたユーザーが閲覧可能にするRLSポリシー
-- データベース分析結果：
-- - store_memberships テーブルのユーザーカラムは business_user_id
-- - review_forms テーブルのユーザーカラムは business_users (store_idは存在しない)
-- - company_id を使用して循環参照を回避

-- 1. question_answer_option_choices テーブルのRLS
-- ユーザーが所属する会社の店舗データのみ閲覧可能
CREATE POLICY "Users can view choices for their company stores" ON question_answer_option_choices
    FOR SELECT 
    USING (
        store_id IN (
            SELECT sm.store_id 
            FROM store_memberships sm
            WHERE sm.business_user_id = auth.uid()
        )
    );

-- 2. review_questions テーブルのRLS
-- review_questions テーブルはstore_idを持たないため、review_formsのbusiness_usersを経由してアクセス制御
CREATE POLICY "Users can view questions for their forms" ON review_questions
    FOR SELECT 
    USING (
        review_fome_id IN (
            SELECT id 
            FROM review_forms 
            WHERE business_users = auth.uid()
        )
    );

-- RLSを有効化
ALTER TABLE question_answer_option_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_questions ENABLE ROW LEVEL SECURITY;

-- 必要に応じて、INSERT, UPDATE, DELETE用のポリシーも追加
-- question_answer_option_choices の INSERT ポリシー
CREATE POLICY "Users can insert choices for their company stores" ON question_answer_option_choices
    FOR INSERT 
    WITH CHECK (
        store_id IN (
            SELECT sm.store_id 
            FROM store_memberships sm
            WHERE sm.business_user_id = auth.uid()
        )
    );

-- question_answer_option_choices の UPDATE ポリシー
CREATE POLICY "Users can update choices for their company stores" ON question_answer_option_choices
    FOR UPDATE 
    USING (
        store_id IN (
            SELECT sm.store_id 
            FROM store_memberships sm
            WHERE sm.business_user_id = auth.uid()
        )
    );

-- question_answer_option_choices の DELETE ポリシー
CREATE POLICY "Users can delete choices for their company stores" ON question_answer_option_choices
    FOR DELETE 
    USING (
        store_id IN (
            SELECT sm.store_id 
            FROM store_memberships sm
            WHERE sm.business_user_id = auth.uid()
        )
    );

-- review_questions の INSERT ポリシー
CREATE POLICY "Users can insert questions for their forms" ON review_questions
    FOR INSERT 
    WITH CHECK (
        review_fome_id IN (
            SELECT id 
            FROM review_forms 
            WHERE business_users = auth.uid()
        )
    );

-- review_questions の UPDATE ポリシー
CREATE POLICY "Users can update questions for their forms" ON review_questions
    FOR UPDATE 
    USING (
        review_fome_id IN (
            SELECT id 
            FROM review_forms 
            WHERE business_users = auth.uid()
        )
    );

-- review_questions の DELETE ポリシー
CREATE POLICY "Users can delete questions for their forms" ON review_questions
    FOR DELETE 
    USING (
        review_fome_id IN (
            SELECT id 
            FROM review_forms 
            WHERE business_users = auth.uid()
        )
    );