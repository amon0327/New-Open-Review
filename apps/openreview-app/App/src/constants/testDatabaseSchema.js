// テストモード用データベーススキーマ定義
// Analytics画面でテストモード時に使用するテストテーブルの構造定義

export const TEST_DATABASE_SCHEMA = {
  // テストユーザー関連テーブル
  TEST_BUSINESS_USERS: 'test_business_users',
  TEST_USERS: 'test_users',
  
  // テスト質問データテーブル
  TEST_REVIEW_FORMS: 'test_review_forms',
  TEST_REVIEW_FORM_PAGES: 'test_review_form_pages',
  TEST_REVIEW_QUESTIONS: 'test_review_questions',
  TEST_QUESTION_OPTION_CHOICES: 'test_question_option_choices',
  TEST_QUESTION_OPTION_LINEAR_SCALE: 'test_question_option_linear_scale',
  
  // テスト回答データテーブル
  TEST_REVIEW_FORM_SUBMISSIONS: 'test_review_form_submissions',
  TEST_REVIEW_QUESTION_ANSWERS: 'test_review_question_answers',
  TEST_QUESTION_ANSWER_TEXTS: 'test_question_answer_texts',
  TEST_QUESTION_ANSWER_OPTION_CHOICES: 'test_question_answer_option_choices',
  TEST_QUESTION_ANSWER_OPTION_LINEAR_SCALE: 'test_question_answer_option_linear_scale'
};

// テスト用テーブル構造定義（参照用）
export const TEST_TABLE_DEFINITIONS = {
  // テストビジネスユーザー
  test_business_users: {
    id: 'uuid',
    created_at: 'timestamp with time zone',
    name: 'text',
    email: 'text',
    profile_image: 'text',
    role: 'member_role',
    organizations: 'uuid'
  },
  
  // テスト一般ユーザー
  test_users: {
    id: 'uuid',
    created_at: 'timestamp with time zone',
    name: 'text',
    email: 'text'
  },
  
  // テストレビューフォーム
  test_review_forms: {
    id: 'uuid',
    created_at: 'timestamp with time zone',
    updated_at: 'timestamp without time zone',
    business_users: 'uuid',
    title: 'text',
    is_published: 'boolean',
    published_url: 'text',
    is_deleted: 'boolean'
  },
  
  // テストレビューフォームページ
  test_review_form_pages: {
    id: 'uuid',
    created_at: 'timestamp with time zone',
    review_forms_id: 'uuid',
    page_number: 'bigint',
    name: 'text'
  },
  
  // テストレビュー質問
  test_review_questions: {
    id: 'uuid',
    created_at: 'timestamp with time zone',
    review_fome_id: 'uuid',
    question_text: 'text',
    is_required: 'boolean',
    question_number: 'bigint',
    question_types_id: 'bigint',
    question_categories_id: 'bigint',
    question_subcategories_id: 'bigint',
    pege_number: 'bigint',
    review_form_pages_id: 'uuid',
    question_detail_text: 'text',
    is_detail_enabled: 'boolean',
    template_review_questions_id: 'uuid'
  },
  
  // テスト質問選択肢
  test_question_option_choices: {
    id: 'uuid',
    created_at: 'timestamp with time zone',
    review_questions_id: 'uuid',
    choice_number: 'bigint',
    choice_name: 'text'
  },
  
  // テスト質問リニアスケール
  test_question_option_linear_scale: {
    id: 'uuid',
    created_at: 'timestamp with time zone',
    review_questions_id: 'uuid',
    min_text: 'text',
    max_text: 'text'
  },
  
  // テストフォーム回答
  test_review_form_submissions: {
    id: 'uuid',
    created_at: 'timestamp with time zone',
    review_forms_id: 'uuid',
    users: 'uuid'
  },
  
  // テスト質問回答
  test_review_question_answers: {
    id: 'uuid',
    created_at: 'timestamp with time zone',
    review_form_submissions_id: 'uuid',
    review_questions_id: 'uuid'
  },
  
  // テストテキスト回答
  test_question_answer_texts: {
    id: 'uuid',
    created_at: 'timestamp with time zone',
    review_questions_answers_id: 'uuid',
    answer_text: 'text'
  },
  
  // テスト選択肢回答
  test_question_answer_option_choices: {
    id: 'uuid',
    created_at: 'timestamp with time zone',
    review_question_answers_id: 'uuid',
    question_option_choices_id: 'uuid'
  },
  
  // テストリニアスケール回答
  test_question_answer_option_linear_scale: {
    id: 'uuid',
    created_at: 'timestamp with time zone',
    review_question_answers_id: 'uuid',
    answer_number: 'bigint'
  }
};

// テストモード用SQL文のテンプレート
export const TEST_MODE_QUERIES = {
  // テストユーザー数取得
  GET_TEST_USER_COUNT: `
    SELECT COUNT(*) as user_count 
    FROM ${TEST_DATABASE_SCHEMA.TEST_USERS}
  `,
  
  // テストビジネスユーザー数取得
  GET_TEST_BUSINESS_USER_COUNT: `
    SELECT COUNT(*) as business_user_count 
    FROM ${TEST_DATABASE_SCHEMA.TEST_BUSINESS_USERS}
  `,
  
  // テストレビューフォーム数取得
  GET_TEST_REVIEW_FORMS_COUNT: `
    SELECT COUNT(*) as form_count 
    FROM ${TEST_DATABASE_SCHEMA.TEST_REVIEW_FORMS}
  `,
  
  // テスト回答数取得
  GET_TEST_SUBMISSIONS_COUNT: `
    SELECT COUNT(*) as submission_count 
    FROM ${TEST_DATABASE_SCHEMA.TEST_REVIEW_FORM_SUBMISSIONS}
  `,
  
  // テスト質問数取得
  GET_TEST_QUESTIONS_COUNT: `
    SELECT COUNT(*) as question_count 
    FROM ${TEST_DATABASE_SCHEMA.TEST_REVIEW_QUESTIONS}
  `
};