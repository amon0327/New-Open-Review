-- 必須質問を管理するテーブルを作成
CREATE TABLE IF NOT EXISTS required_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- ページ情報
  page_number INT NOT NULL,
  page_title TEXT NOT NULL,
  
  -- 質問情報
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  question_type INT NOT NULL, -- 1-8の質問タイプ
  is_required BOOLEAN DEFAULT true,
  
  -- オプション情報（JSONBで柔軟に保存）
  options JSONB, -- 選択肢の配列 [{value: 1, label: "選択肢1"}, ...]
  
  -- バリデーションルール
  validation_rules JSONB, -- {minLength: 10, maxLength: 100, pattern: "^[0-9]+$"}
  
  -- 表示制御
  is_active BOOLEAN DEFAULT true,
  display_order INT,
  
  -- メタデータ
  metadata JSONB, -- その他の設定情報
  
  UNIQUE(page_number, question_number)
);

-- インデックス作成
CREATE INDEX idx_required_questions_page_number ON required_questions(page_number);
CREATE INDEX idx_required_questions_is_active ON required_questions(is_active);
CREATE INDEX idx_required_questions_display_order ON required_questions(display_order);

-- 必須質問への回答を保存するテーブル
CREATE TABLE IF NOT EXISTS required_question_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- リレーション
  review_form_submission_id UUID REFERENCES review_form_submissions(id) ON DELETE CASCADE,
  required_question_id UUID REFERENCES required_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 回答データ（質問タイプに応じて使い分け）
  text_answer TEXT, -- タイプ1,2用
  selected_option INT, -- タイプ3,5,7,8用
  selected_options INT[], -- タイプ4,6用
  
  -- メタデータ
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(review_form_submission_id, required_question_id)
);

-- インデックス作成
CREATE INDEX idx_required_question_answers_submission ON required_question_answers(review_form_submission_id);
CREATE INDEX idx_required_question_answers_user ON required_question_answers(user_id);

-- RLS (Row Level Security) の設定
ALTER TABLE required_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE required_question_answers ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成
-- 必須質問は誰でも読み取り可能
CREATE POLICY "Required questions are viewable by everyone" ON required_questions
  FOR SELECT USING (true);

-- 必須質問への回答は認証されたユーザーが作成可能
CREATE POLICY "Users can create their own required question answers" ON required_question_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の回答のみ閲覧可能
CREATE POLICY "Users can view their own required question answers" ON required_question_answers
  FOR SELECT USING (auth.uid() = user_id);

-- トリガー関数：updated_atを自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER update_required_questions_updated_at BEFORE UPDATE ON required_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF < /dev/null