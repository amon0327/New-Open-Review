-- ============================================================================
-- 孤立した質問を自動削除するトリガー
--
-- 目的: review_question_form_linksからリンクが削除された際、
-- その質問への他のリンクが存在しない場合は質問本体も削除する
--
-- シナリオ:
-- 1. フォームAで質問を作成
-- 2. フォームBにその質問をリンク（共有）
-- 3. フォームAを削除 → リンクが削除される
-- 4. このトリガーが発火 → フォームBにまだリンクがあるので質問は残る
-- 5. フォームBも削除 → リンクが削除される
-- 6. このトリガーが発火 → 他にリンクがないので質問本体を削除
-- ============================================================================

-- トリガー関数の作成
CREATE OR REPLACE FUNCTION cleanup_orphan_questions()
RETURNS TRIGGER AS $$
BEGIN
  -- 削除されたリンクの質問に他のリンクがまだ存在するか確認
  IF NOT EXISTS (
    SELECT 1 FROM review_question_form_links
    WHERE review_question_id = OLD.review_question_id
  ) THEN
    -- 他のリンクがなければ、関連データと質問本体を削除

    -- 1. 選択肢オプションを削除
    DELETE FROM question_option_choices
    WHERE review_questions_id = OLD.review_question_id;

    -- 2. リニアスケールオプションを削除
    DELETE FROM question_option_linear_scale
    WHERE review_questions_id = OLD.review_question_id;

    -- 3. 質問本体を削除
    DELETE FROM review_questions
    WHERE id = OLD.review_question_id;

    RAISE NOTICE 'Orphan question deleted: %', OLD.review_question_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 既存のトリガーがあれば削除
DROP TRIGGER IF EXISTS cleanup_orphan_questions_trigger ON review_question_form_links;

-- トリガーの作成（リンク削除後に実行）
CREATE TRIGGER cleanup_orphan_questions_trigger
  AFTER DELETE ON review_question_form_links
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphan_questions();

-- コメント
COMMENT ON FUNCTION cleanup_orphan_questions() IS
'review_question_form_linksからリンクが削除された際、他にリンクがない質問を自動削除する';
