// 必須質問の設定ファイル
// このファイルを編集することで、質問内容を簡単に変更できます

// QuestionsPageと同じデータ構造を使用
export const REQUIRED_PAGES = [
  {
    id: 'required-page-1',
    review_forms_id: 'required',
    page_number: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'required-page-2',
    review_forms_id: 'required',
    page_number: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'required-page-3',
    review_forms_id: 'required',
    page_number: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'required-page-4',
    review_forms_id: 'required',
    page_number: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'required-page-5',
    review_forms_id: 'required',
    page_number: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const REQUIRED_QUESTIONS = [
  // ページ1: 基本情報
  {
    id: 'required_1_1',
    review_fome_id: 'required',
    review_form_pages_id: 'required-page-1',
    pege_number: 1,
    question_type_id: 9,  // NPS（11段階）
    question_number: 1,
    question_text: '当店を、友人や知人におすすめしたいと思いますか？',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    question_option_choices: [],
    question_option_linear_scale: [
      {
        id: 'scale_1_1',
        review_questions_id: 'required_1_1',
        scale_max_number: 10,
        scale_min_number: 0,
        scale_max_label: '非常におすすめしたい',
        scale_min_label: '全くおすすめしない'
      }
    ]
  },
  {
    id: 'required_1_2',
    review_fome_id: 'required',
    review_form_pages_id: 'required-page-1',
    pege_number: 1,
    question_type_id: 8,  // プルダウン
    question_number: 2,
    question_text: '次回ご来店いただけるとしたら、どのくらいの時期をお考えですか？',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    question_option_choices: [
      { id: 'opt_1_2_1', review_questions_id: 'required_1_2', choice_number: 1, choice_name: '1ヶ月以内' },
      { id: 'opt_1_2_2', review_questions_id: 'required_1_2', choice_number: 2, choice_name: '3ヶ月以内' },
      { id: 'opt_1_2_3', review_questions_id: 'required_1_2', choice_number: 3, choice_name: '6ヶ月以内' },
      { id: 'opt_1_2_4', review_questions_id: 'required_1_2', choice_number: 4, choice_name: '10ヶ月以内' },
      { id: 'opt_1_2_5', review_questions_id: 'required_1_2', choice_number: 5, choice_name: '1年以内' },
      { id: 'opt_1_2_6', review_questions_id: 'required_1_2', choice_number: 6, choice_name: '1年以上' }
    ],
    question_option_linear_scale: []
  },
  {
    id: 'required_1_3',
    review_fome_id: 'required',
    review_form_pages_id: 'required-page-1',
    pege_number: 1,
    question_type_id: 8,  // プルダウン
    question_number: 3,
    question_text: 'これまでに当店へ来店されたことはありますか？',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    question_option_choices: [
      { id: 'opt_1_3_1', review_questions_id: 'required_1_3', choice_number: 1, choice_name: '初めて' },
      { id: 'opt_1_3_2', review_questions_id: 'required_1_3', choice_number: 2, choice_name: '2回目' },
      { id: 'opt_1_3_3', review_questions_id: 'required_1_3', choice_number: 3, choice_name: '3回目' },
      { id: 'opt_1_3_4', review_questions_id: 'required_1_3', choice_number: 4, choice_name: '4回目' },
      { id: 'opt_1_3_5', review_questions_id: 'required_1_3', choice_number: 5, choice_name: '5回目' },
      { id: 'opt_1_3_6', review_questions_id: 'required_1_3', choice_number: 6, choice_name: '6回目〜10回目' },
      { id: 'opt_1_3_7', review_questions_id: 'required_1_3', choice_number: 7, choice_name: '11回目以上' }
    ],
    question_option_linear_scale: []
  },
  {
    id: 'required_1_4',
    review_fome_id: 'required',
    review_form_pages_id: 'required-page-1',
    pege_number: 1,
    question_type_id: 8,  // プルダウン
    question_number: 4,
    question_text: '性別を教えてください。',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    question_option_choices: [
      { id: 'opt_1_4_1', review_questions_id: 'required_1_4', choice_number: 1, choice_name: '男性' },
      { id: 'opt_1_4_2', review_questions_id: 'required_1_4', choice_number: 2, choice_name: '女性' },
      { id: 'opt_1_4_3', review_questions_id: 'required_1_4', choice_number: 3, choice_name: 'その他' }
    ],
    question_option_linear_scale: []
  },
  {
    id: 'required_1_5',
    review_fome_id: 'required',
    review_form_pages_id: 'required-page-1',
    pege_number: 1,
    question_type_id: 8,  // プルダウン
    question_number: 5,
    question_text: '年齢を教えてください。',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    question_option_choices: [
      { id: 'opt_1_5_1', review_questions_id: 'required_1_5', choice_number: 1, choice_name: '〜19歳' },
      { id: 'opt_1_5_2', review_questions_id: 'required_1_5', choice_number: 2, choice_name: '20歳〜24歳' },
      { id: 'opt_1_5_3', review_questions_id: 'required_1_5', choice_number: 3, choice_name: '25歳〜29歳' },
      { id: 'opt_1_5_4', review_questions_id: 'required_1_5', choice_number: 4, choice_name: '30歳〜34歳' },
      { id: 'opt_1_5_5', review_questions_id: 'required_1_5', choice_number: 5, choice_name: '35歳〜39歳' },
      { id: 'opt_1_5_6', review_questions_id: 'required_1_5', choice_number: 6, choice_name: '40歳〜44歳' },
      { id: 'opt_1_5_7', review_questions_id: 'required_1_5', choice_number: 7, choice_name: '45歳〜49歳' },
      { id: 'opt_1_5_8', review_questions_id: 'required_1_5', choice_number: 8, choice_name: '50歳〜54歳' },
      { id: 'opt_1_5_9', review_questions_id: 'required_1_5', choice_number: 9, choice_name: '55歳〜59歳' },
      { id: 'opt_1_5_10', review_questions_id: 'required_1_5', choice_number: 10, choice_name: '60歳〜69歳' },
      { id: 'opt_1_5_11', review_questions_id: 'required_1_5', choice_number: 11, choice_name: '70歳〜79歳' },
      { id: 'opt_1_5_12', review_questions_id: 'required_1_5', choice_number: 12, choice_name: '80歳〜' }
    ],
    question_option_linear_scale: []
  },
  {
    id: 'required_1_6',
    review_fome_id: 'required',
    review_form_pages_id: 'required-page-1',
    pege_number: 1,
    question_type_id: 8,  // プルダウン
    question_number: 6,
    question_text: '本日はどなたとご一緒に来店されましたか？',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    question_option_choices: [
      { id: 'opt_1_6_1', review_questions_id: 'required_1_6', choice_number: 1, choice_name: 'お一人' },
      { id: 'opt_1_6_2', review_questions_id: 'required_1_6', choice_number: 2, choice_name: 'ご家族' },
      { id: 'opt_1_6_3', review_questions_id: 'required_1_6', choice_number: 3, choice_name: 'ご友人' },
      { id: 'opt_1_6_4', review_questions_id: 'required_1_6', choice_number: 4, choice_name: '恋人・パートナー' },
      { id: 'opt_1_6_5', review_questions_id: 'required_1_6', choice_number: 5, choice_name: '職場の同僚' },
      { id: 'opt_1_6_6', review_questions_id: 'required_1_6', choice_number: 6, choice_name: 'お取引先・ビジネス関係' },
      { id: 'opt_1_6_7', review_questions_id: 'required_1_6', choice_number: 7, choice_name: 'その他' }
    ],
    question_option_linear_scale: []
  },

  // ページ2: 7段階評価（質問タイプ7）
  {
    id: 'required_2_1',
    review_fome_id: 'required',
    review_form_pages_id: 'required-page-2',
    pege_number: 2,
    question_type_id: 7,
    question_number: 1,
    question_text: '料理やドリンクの魅力は、ご来店前のイメージと比べていかがでしたか？',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    question_option_choices: [],
    question_option_linear_scale: [
      {
        id: 'scale_2_1',
        review_questions_id: 'required_2_1',
        scale_max_number: 7,
        scale_min_number: 1,
        scale_max_label: '満足した',
        scale_min_label: '不満だった'
      }
    ]
  },
  {
    id: 'required_2_2',
    review_fome_id: 'required',
    review_form_pages_id: 'required-page-2',
    pege_number: 2,
    question_type_id: 7,
    question_number: 2,
    question_text: '接客や対応の印象は、ご来店前のイメージと比べていかがでしたか？',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    question_option_choices: [],
    question_option_linear_scale: [
      {
        id: 'scale_2_2',
        review_questions_id: 'required_2_2',
        scale_max_number: 7,
        scale_min_number: 1,
        scale_max_label: '満足した',
        scale_min_label: '不満だった'
      }
    ]
  },
  {
    id: 'required_2_3',
    review_fome_id: 'required',
    review_form_pages_id: 'required-page-2',
    pege_number: 2,
    question_type_id: 7,
    question_number: 3,
    question_text: '清潔さや衛生面の印象は、ご来店前のイメージと比べていかがでしたか？',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    question_option_choices: [],
    question_option_linear_scale: [
      {
        id: 'scale_2_3',
        review_questions_id: 'required_2_3',
        scale_max_number: 7,
        scale_min_number: 1,
        scale_max_label: '満足した',
        scale_min_label: '不満だった'
      }
    ]
  },

  // ページ3: 動的に生成される質問（条件分岐による）
  // このページの質問は実行時に動的に生成されます

  // ページ4: 動的に生成される質問（選択された側面による）
  // このページの質問は実行時に動的に生成されます

  // ページ5: トーナメント式比較質問（質問タイプ11）
  {
    id: 'required_5_1',
    review_fome_id: 'required',
    review_form_pages_id: 'required-page-5',
    pege_number: 5,
    question_type_id: 11,  // トーナメント式比較質問
    question_number: 1,
    question_text: '普段利用する時どちらの店舗を選びますか？',
    is_required: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    question_option_choices: [],
    question_option_linear_scale: [],
    is_tournament: true, // トーナメントモードフラグ
    tournament_attributes: [
      {
        id: 'taste',
        name: '味',
        positive: '味は美味しい',
        negative: '味はいまいちな',
        positive_conjunction: 'が、',
        negative_conjunction: 'だが、'
      },
      {
        id: 'service',
        name: '接客',
        positive: '店員は親切',
        negative: '店員の対応が冷たい',
        positive_conjunction: 'だが、',
        negative_conjunction: 'だが、'
      },
      {
        id: 'space',
        name: '空間',
        positive: 'プライベート感のある空間',
        negative: '席同士が近くて騒がしい',
        positive_conjunction: 'だが、',
        negative_conjunction: 'だが、'
      },
      {
        id: 'hygiene',
        name: '衛生',
        positive: '店内はきれい',
        negative: '店内が汚い',
        positive_conjunction: 'だが、',
        negative_conjunction: 'だが、'
      },
      {
        id: 'price',
        name: '価格',
        positive: '値段は安い',
        negative: '値段が高い',
        positive_conjunction: 'が、',
        negative_conjunction: 'だが、'
      }
    ],
    target_ranks: 2 // 上位2位まで決定
  }
];

// ヘルパー関数
export const getRequiredQuestionsForPage = (pageNumber) => {
  return REQUIRED_QUESTIONS.filter(q => q.pege_number === pageNumber);
};

export const getRequiredPageByNumber = (pageNumber) => {
  return REQUIRED_PAGES.find(p => p.page_number === pageNumber);
};

export const getTotalRequiredPages = () => {
  return REQUIRED_PAGES.length;
};