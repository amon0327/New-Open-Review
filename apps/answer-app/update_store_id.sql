-- ====================================================================
-- 既存回答データにstore_idを書き込むSQL
-- 作成日: 2025-10-22
-- 目的: 既存のレビューフォーム回答データにstore_idを追加
-- ====================================================================

-- --------------------------------------------------------------------
-- 実行前確認: 現在の状況を確認
-- --------------------------------------------------------------------

-- 1. store_review_formsテーブルの内容確認
SELECT 
    srf.review_form_id,
    srf.store_id,
    rf.title as review_form_title
FROM store_review_forms srf
LEFT JOIN review_forms rf ON srf.review_form_id = rf.id
ORDER BY srf.created_at DESC;

-- 2. 各テーブルのstore_id設定状況確認
SELECT 'review_form_submissions' as table_name, 
       COUNT(*) as total_records,
       COUNT(store_id) as with_store_id,
       COUNT(*) - COUNT(store_id) as null_store_id
FROM review_form_submissions
UNION ALL
SELECT 'review_question_answers' as table_name,
       COUNT(*) as total_records,
       COUNT(store_id) as with_store_id,
       COUNT(*) - COUNT(store_id) as null_store_id
FROM review_question_answers
UNION ALL
SELECT 'question_answer_option_choices' as table_name,
       COUNT(*) as total_records,
       COUNT(store_id) as with_store_id,
       COUNT(*) - COUNT(store_id) as null_store_id
FROM question_answer_option_choices
UNION ALL
SELECT 'question_answer_option_linear_scale' as table_name,
       COUNT(*) as total_records,
       COUNT(store_id) as with_store_id,
       COUNT(*) - COUNT(store_id) as null_store_id
FROM question_answer_option_linear_scale
UNION ALL
SELECT 'question_answer_texts' as table_name,
       COUNT(*) as total_records,
       COUNT(store_id) as with_store_id,
       COUNT(*) - COUNT(store_id) as null_store_id
FROM question_answer_texts;

-- 3. review_form_submissionsとstore_review_formsの関係確認
SELECT 
    rfs.review_forms_id,
    COUNT(rfs.id) as submission_count,
    srf.store_id,
    CASE WHEN srf.store_id IS NOT NULL THEN 'store_id_available' ELSE 'no_store_id' END as store_status
FROM review_form_submissions rfs
LEFT JOIN store_review_forms srf ON rfs.review_forms_id = srf.review_form_id
GROUP BY rfs.review_forms_id, srf.store_id
ORDER BY submission_count DESC;

-- --------------------------------------------------------------------
-- メイン更新処理（トランザクション）
-- --------------------------------------------------------------------

BEGIN;

-- ステップ1: review_form_submissionsテーブルの更新
-- store_review_formsから直接store_idを取得
UPDATE review_form_submissions 
SET store_id = srf.store_id
FROM store_review_forms srf
WHERE review_form_submissions.review_forms_id = srf.review_form_id
  AND review_form_submissions.store_id IS NULL;

-- 確認: 更新された行数を表示
-- Note: PostgreSQLではROW_COUNT()の代わりにGET DIAGNOSTICS文を使用

-- ステップ2: review_question_answersテーブルの更新
-- review_form_submissions経由でstore_idを取得
UPDATE review_question_answers 
SET store_id = rfs.store_id
FROM review_form_submissions rfs
WHERE review_question_answers.review_form_submissions_id = rfs.id
  AND review_question_answers.store_id IS NULL
  AND rfs.store_id IS NOT NULL;

-- 確認: PostgreSQLでは行数確認はクライアント側で表示されます

-- ステップ3: question_answer_option_choicesテーブルの更新
-- review_question_answers経由でstore_idを取得
UPDATE question_answer_option_choices 
SET store_id = rqa.store_id
FROM review_question_answers rqa
WHERE question_answer_option_choices.review_question_answers_id = rqa.id
  AND question_answer_option_choices.store_id IS NULL
  AND rqa.store_id IS NOT NULL;

-- 確認: PostgreSQLでは行数確認はクライアント側で表示されます

-- ステップ4: question_answer_option_linear_scaleテーブルの更新
-- review_question_answers経由でstore_idを取得
UPDATE question_answer_option_linear_scale 
SET store_id = rqa.store_id
FROM review_question_answers rqa
WHERE question_answer_option_linear_scale.review_question_answers_id = rqa.id
  AND question_answer_option_linear_scale.store_id IS NULL
  AND rqa.store_id IS NOT NULL;

-- 確認: PostgreSQLでは行数確認はクライアント側で表示されます

-- ステップ5: question_answer_textsテーブルの更新
-- review_question_answers経由でstore_idを取得
UPDATE question_answer_texts 
SET store_id = rqa.store_id
FROM review_question_answers rqa
WHERE question_answer_texts.review_questions_answers_id = rqa.id
  AND question_answer_texts.store_id IS NULL
  AND rqa.store_id IS NOT NULL;

-- 確認: PostgreSQLでは行数確認はクライアント側で表示されます

-- 注意: ここで結果を確認してからCOMMITまたはROLLBACKを実行
-- 問題がなければ: COMMIT;
-- 問題があれば: ROLLBACK;

-- --------------------------------------------------------------------
-- 実行後確認: 更新結果をチェック
-- --------------------------------------------------------------------

-- 1. 更新後の各テーブルのstore_id設定状況
SELECT 'After Update - review_form_submissions' as table_name, 
       COUNT(*) as total_records,
       COUNT(store_id) as with_store_id,
       COUNT(*) - COUNT(store_id) as null_store_id
FROM review_form_submissions
UNION ALL
SELECT 'After Update - review_question_answers' as table_name,
       COUNT(*) as total_records,
       COUNT(store_id) as with_store_id,
       COUNT(*) - COUNT(store_id) as null_store_id
FROM review_question_answers
UNION ALL
SELECT 'After Update - question_answer_option_choices' as table_name,
       COUNT(*) as total_records,
       COUNT(store_id) as with_store_id,
       COUNT(*) - COUNT(store_id) as null_store_id
FROM question_answer_option_choices
UNION ALL
SELECT 'After Update - question_answer_option_linear_scale' as table_name,
       COUNT(*) as total_records,
       COUNT(store_id) as with_store_id,
       COUNT(*) - COUNT(store_id) as null_store_id
FROM question_answer_option_linear_scale
UNION ALL
SELECT 'After Update - question_answer_texts' as table_name,
       COUNT(*) as total_records,
       COUNT(store_id) as with_store_id,
       COUNT(*) - COUNT(store_id) as null_store_id
FROM question_answer_texts;

-- 2. データ整合性チェック
-- review_form_submissionsとreview_question_answersのstore_id一致確認
SELECT 
    'Data Consistency Check' as check_type,
    COUNT(*) as total_pairs,
    SUM(CASE WHEN rfs.store_id = rqa.store_id OR (rfs.store_id IS NULL AND rqa.store_id IS NULL) THEN 1 ELSE 0 END) as matching_store_ids,
    COUNT(*) - SUM(CASE WHEN rfs.store_id = rqa.store_id OR (rfs.store_id IS NULL AND rqa.store_id IS NULL) THEN 1 ELSE 0 END) as mismatched_store_ids
FROM review_form_submissions rfs
JOIN review_question_answers rqa ON rfs.id = rqa.review_form_submissions_id;

-- 3. store_idがnullのレコードの詳細（レビューフォーム別）
SELECT 
    rfs.review_forms_id,
    rf.title as review_form_title,
    COUNT(rfs.id) as submissions_with_null_store_id,
    CASE WHEN srf.store_id IS NULL THEN 'No store mapping in store_review_forms' ELSE 'Store mapping exists' END as reason
FROM review_form_submissions rfs
LEFT JOIN review_forms rf ON rfs.review_forms_id = rf.id
LEFT JOIN store_review_forms srf ON rfs.review_forms_id = srf.review_form_id
WHERE rfs.store_id IS NULL
GROUP BY rfs.review_forms_id, rf.title, srf.store_id
ORDER BY submissions_with_null_store_id DESC;

-- --------------------------------------------------------------------
-- 手動実行が必要なコマンド
-- --------------------------------------------------------------------

-- 実行結果を確認後、以下のいずれかを実行:
-- COMMIT;    -- 問題がない場合
-- ROLLBACK;  -- 問題がある場合

-- ====================================================================
-- 使用方法と注意事項
-- ====================================================================

/*
【実行手順】
1. 実行前確認クエリを実行して現状を把握
2. トランザクション（BEGIN;）から各ステップを順番に実行
3. 各ステップ後の確認クエリで結果をチェック
4. 全て完了後、実行後確認クエリでデータ整合性をチェック
5. 問題なければCOMMIT;、問題があればROLLBACK;

【注意事項】
- 必ず実行前にデータベースのバックアップを取得
- テスト環境で事前に検証することを推奨
- 大量データの場合は処理時間を考慮
- 本番環境では保守時間内での実行を推奨

【エラーが発生した場合】
- ROLLBACKでトランザクションを取り消し
- エラーメッセージを確認してテーブル構造やデータを再確認
- 必要に応じてSQLを調整して再実行
*/