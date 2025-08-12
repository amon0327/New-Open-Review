// データベース設定管理
// テストモード削除時は、テスト関連設定のみを削除すればよい

const DATABASE_CONFIG = {
  // 本番データベース設定（削除不要）
  production: {
    REVIEW_FORMS: 'review_forms',
    REVIEW_FORM_SUBMISSIONS: 'review_form_submissions', 
    REVIEW_QUESTIONS: 'review_questions',
    REVIEW_FORM_PAGES: 'review_form_pages',
    QUESTION_OPTION_CHOICES: 'question_option_choices',
    QUESTION_OPTION_LINEAR_SCALE: 'question_option_linear_scale',
    REVIEW_QUESTION_ANSWERS: 'review_question_answers',
    QUESTION_ANSWER_TEXTS: 'question_answer_texts',
    QUESTION_ANSWER_OPTION_CHOICES: 'question_answer_option_choices',
    QUESTION_ANSWER_OPTION_LINEAR_SCALE: 'question_answer_option_linear_scale',
    BUSINESS_USERS: 'business_users',
    USERS: 'users'
  },

  // ========= テストデータベース設定（削除予定） =========
  test: {
    REVIEW_FORMS: 'test_review_forms',
    REVIEW_FORM_SUBMISSIONS: 'test_review_form_submissions',
    REVIEW_QUESTIONS: 'test_review_questions', 
    REVIEW_FORM_PAGES: 'test_review_form_pages',
    QUESTION_OPTION_CHOICES: 'test_question_option_choices',
    QUESTION_OPTION_LINEAR_SCALE: 'test_question_option_linear_scale',
    REVIEW_QUESTION_ANSWERS: 'test_review_question_answers',
    QUESTION_ANSWER_TEXTS: 'test_question_answer_texts',
    QUESTION_ANSWER_OPTION_CHOICES: 'test_question_answer_option_choices',
    QUESTION_ANSWER_OPTION_LINEAR_SCALE: 'test_question_answer_option_linear_scale',
    BUSINESS_USERS: 'test_business_users',
    USERS: 'test_users'
  }
  // ====================================================
};

// データベース設定取得関数
export const getDatabaseConfig = (isTestMode = false) => {
  // ========= テストモード分岐（削除予定） =========
  return DATABASE_CONFIG[isTestMode ? 'test' : 'production'];
  // ============================================
  
  // 削除後は以下のコードに置き換える:
  // return DATABASE_CONFIG.production;
};

// 特定のテーブル名取得のヘルパー関数（削除不要）
export const getTableName = (tableName, isTestMode = false) => {
  const config = getDatabaseConfig(isTestMode);
  return config[tableName];
};

// テーブル名の定数（削除不要）
export const TABLE_NAMES = {
  REVIEW_FORMS: 'REVIEW_FORMS',
  REVIEW_FORM_SUBMISSIONS: 'REVIEW_FORM_SUBMISSIONS',
  REVIEW_QUESTIONS: 'REVIEW_QUESTIONS',
  REVIEW_FORM_PAGES: 'REVIEW_FORM_PAGES',
  QUESTION_OPTION_CHOICES: 'QUESTION_OPTION_CHOICES',
  QUESTION_OPTION_LINEAR_SCALE: 'QUESTION_OPTION_LINEAR_SCALE',
  REVIEW_QUESTION_ANSWERS: 'REVIEW_QUESTION_ANSWERS',
  QUESTION_ANSWER_TEXTS: 'QUESTION_ANSWER_TEXTS',
  QUESTION_ANSWER_OPTION_CHOICES: 'QUESTION_ANSWER_OPTION_CHOICES',
  QUESTION_ANSWER_OPTION_LINEAR_SCALE: 'QUESTION_ANSWER_OPTION_LINEAR_SCALE',
  BUSINESS_USERS: 'BUSINESS_USERS',
  USERS: 'USERS'
};