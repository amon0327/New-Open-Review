// 条件分岐ロジックの設定ファイル
// このファイルを編集することで、条件分岐のルールを簡単に変更できます

// NPSスコアの分類
export const NPS_CATEGORIES = {
  DETRACTOR: { min: 0, max: 6, label: '批判' },
  NEUTRAL: { min: 7, max: 8, label: '中立' },
  PROMOTER: { min: 9, max: 10, label: '推奨' }
};

// グループ分類のルール
export const GROUP_RULES = [
  // グループA: 良かったところ
  { id: 1, nps: 'PROMOTER', revisit: true, experience: true, group: 'A' },
  { id: 2, nps: 'PROMOTER', revisit: true, experience: false, group: 'A' },
  { id: 6, nps: 'NEUTRAL', revisit: true, experience: false, group: 'A' },
  
  // グループB: 改善点
  { id: 7, nps: 'NEUTRAL', revisit: false, experience: true, group: 'B' },
  { id: 8, nps: 'NEUTRAL', revisit: false, experience: false, group: 'B' },
  { id: 10, nps: 'DETRACTOR', revisit: true, experience: false, group: 'B' },
  { id: 11, nps: 'DETRACTOR', revisit: false, experience: true, group: 'B' },
  { id: 12, nps: 'DETRACTOR', revisit: false, experience: false, group: 'B' },
  
  // グループC: 追加条件分岐
  { id: 3, nps: 'PROMOTER', revisit: false, experience: true, group: 'C' },
  { id: 4, nps: 'PROMOTER', revisit: false, experience: false, group: 'C' },
  { id: 5, nps: 'NEUTRAL', revisit: true, experience: true, group: 'C' },
  { id: 9, nps: 'DETRACTOR', revisit: true, experience: true, group: 'C' }
];

// ページ2の評価項目
export const PAGE2_ASPECTS = {
  'required_2_1': {
    label: '料理やドリンクの魅力',
    shortLabel: '料理・ドリンク',
    aspectType: 'quality'
  },
  'required_2_2': {
    label: '接客や対応の印象',
    shortLabel: '接客・対応',
    aspectType: 'service'
  },
  'required_2_3': {
    label: '清潔さや衛生面の印象',
    shortLabel: '清潔さ・衛生',
    aspectType: 'cleanliness'
  }
};

// Quality詳細項目
export const QUALITY_MATRIX_ITEMS = [
  { id: 'q1', text: '料理の味について' },
  { id: 'q2', text: '料理の見た目について' },
  { id: 'q3', text: '料理の量/ボリュームについて' },
  { id: 'q4', text: 'ドリンクの味について' },
  { id: 'q5', text: 'ドリンクの温度について' },
  { id: 'q6', text: 'メニューに食べたいと思う料理があったか' },
  { id: 'q7', text: 'メニューに飲みたいと思うドリンクがあったか' },
  { id: 'q8', text: 'メニューの種類は十分だったか' },
  { id: 'q9', text: 'ドリンク・お料理の温度（温かい/冷たい）' },
  { id: 'q10', text: '他店と比べて特徴や独自性を感じたか' }
];

// Service詳細項目
export const SERVICE_MATRIX_ITEMS = [
  { id: 's1', text: '入店時の挨拶' },
  { id: 's2', text: '席への案内' },
  { id: 's3', text: '注文時の対応' },
  { id: 's4', text: 'メニュー説明・提案' },
  { id: 's5', text: '料理・ドリンクの提供スピード' },
  { id: 's6', text: '注文や提供は正確だったか' },
  { id: 's7', text: 'スタッフの気配り' },
  { id: 's8', text: 'スタッフの笑顔・感じの良さ' },
  { id: 's9', text: 'スタッフの言葉遣い' },
  { id: 's10', text: '印象的なスタッフはいたか' }
];

// Cleanliness詳細項目
export const CLEANLINESS_MATRIX_ITEMS = [
  { id: 'c1', text: '店舗外観・入口は清潔だったか' },
  { id: 'c2', text: 'テーブルは清潔だったか' },
  { id: 'c3', text: '椅子・ソファは清潔だったか' },
  { id: 'c4', text: '床は清潔だったか' },
  { id: 'c5', text: '食器・カトラリーは清潔だったか' },
  { id: 'c6', text: 'メニュー表・卓上備品は清潔だったか' },
  { id: 'c7', text: 'トイレは清潔だったか' },
  { id: 'c8', text: '店内の空気や匂いは不快でなかったか' },
  { id: 'c9', text: '店内の整理整頓はできていたか' },
  { id: 'c10', text: 'スタッフの身だしなみは清潔だったか' }
];

// グループ別の質問生成ルール
export const GROUP_QUESTION_RULES = {
  A: {
    // グループA: 最も評価が高かった項目について聞く
    selectAspect: 'highest',
    questionType: 'positive',
    generateQuestions: (aspect) => ({
      mainQuestion: `${aspect.label}について、特に良かった点を教えてください。`,
      followUpQuestions: [
        {
          type: 'multipleChoice',
          text: `${aspect.shortLabel}で特に良かった点を選んでください（複数選択可）`,
          options: getPositiveOptions(aspect.shortLabel)
        }
      ]
    })
  },
  B: {
    // グループB: 最も評価が低かった項目について聞く
    selectAspect: 'lowest',
    questionType: 'negative',
    generateQuestions: (aspect) => ({
      mainQuestion: `${aspect.label}について、改善が必要と感じた点を教えてください。`,
      followUpQuestions: [
        {
          type: 'multipleChoice',
          text: `${aspect.shortLabel}で改善が必要と感じた点を選んでください（複数選択可）`,
          options: getNegativeOptions(aspect.shortLabel)
        }
      ]
    })
  },
  C: {
    // グループC: 条件付き分岐（気になる点の有無で判断）
    requiresAdditionalQuestion: true,
    additionalQuestion: {
      id: 'required_2_4',
      question_type_id: 3, // 単一選択
      question_text: 'ご来店中、何か気になる点はございましたか？',
      options: [
        { id: 'opt_2_4_1', choice_name: 'はい', value: true },
        { id: 'opt_2_4_2', choice_name: 'いいえ', value: false }
      ]
    },
    selectAspect: (hasIssues) => hasIssues ? 'lowest' : 'highest',
    questionType: (hasIssues) => hasIssues ? 'negative' : 'positive',
    generateQuestions: (aspect, hasIssues) => {
      if (hasIssues) {
        // 気になる点があった場合（ネガティブ）
        return GROUP_QUESTION_RULES.B.generateQuestions(aspect);
      } else {
        // 気になる点がなかった場合（ポジティブ）
        return GROUP_QUESTION_RULES.A.generateQuestions(aspect);
      }
    }
  }
};

// ポジティブな選択肢を生成
function getPositiveOptions(aspectShortLabel) {
  const baseOptions = {
    '料理・ドリンク': [
      '味が美味しかった',
      '見た目が良かった',
      '量がちょうど良かった',
      'メニューの種類が豊富',
      '価格に対して満足',
      'オリジナリティがあった'
    ],
    '接客・対応': [
      'スタッフが親切だった',
      '対応が迅速だった',
      '説明が丁寧だった',
      '笑顔が良かった',
      '気配りが行き届いていた',
      'プロフェッショナルだった'
    ],
    '清潔さ・衛生': [
      '店内が清潔だった',
      'トイレが綺麗だった',
      'テーブルが清潔だった',
      '食器が綺麗だった',
      '感染対策がしっかりしていた',
      '整理整頓されていた'
    ]
  };
  
  return baseOptions[aspectShortLabel] || [];
}

// ネガティブな選択肢を生成
function getNegativeOptions(aspectShortLabel) {
  const baseOptions = {
    '料理・ドリンク': [
      '味が期待外れだった',
      '見た目が良くなかった',
      '量が少なかった/多すぎた',
      'メニューの種類が少ない',
      '価格が高いと感じた',
      '温度が適切でなかった'
    ],
    '接客・対応': [
      'スタッフの対応が遅かった',
      '説明が不十分だった',
      '態度が良くなかった',
      '注文を間違えられた',
      '呼んでも来なかった',
      '気配りが不足していた'
    ],
    '清潔さ・衛生': [
      '店内に汚れがあった',
      'トイレが汚かった',
      'テーブルが汚れていた',
      '食器に汚れがあった',
      '床にゴミが落ちていた',
      '整理整頓されていなかった'
    ]
  };
  
  return baseOptions[aspectShortLabel] || [];
}

// ヘルパー関数：NPSスコアからカテゴリを取得
export function getNPSCategory(score) {
  if (score >= NPS_CATEGORIES.PROMOTER.min && score <= NPS_CATEGORIES.PROMOTER.max) {
    return 'PROMOTER';
  } else if (score >= NPS_CATEGORIES.NEUTRAL.min && score <= NPS_CATEGORIES.NEUTRAL.max) {
    return 'NEUTRAL';
  } else if (score >= NPS_CATEGORIES.DETRACTOR.min && score <= NPS_CATEGORIES.DETRACTOR.max) {
    return 'DETRACTOR';
  }
  return null;
}

// ヘルパー関数：回答からグループを判定
export function determineGroup(npsScore, willRevisit, hasVisitedBefore) {
  const npsCategory = getNPSCategory(npsScore);
  
  const matchingRule = GROUP_RULES.find(rule => 
    rule.nps === npsCategory &&
    rule.revisit === willRevisit &&
    rule.experience === hasVisitedBefore
  );
  
  return matchingRule ? matchingRule.group : null;
}

// ヘルパー関数：文字列から疑似ランダムな数値を生成（シード値として使用）
function stringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// ヘルパー関数：最高/最低評価の項目を取得
export function selectAspectByRating(page2Answers, selectionType) {
  const ratings = Object.entries(PAGE2_ASPECTS).map(([questionId, aspect]) => ({
    questionId,
    aspect,
    rating: page2Answers[questionId]?.answer ? parseInt(page2Answers[questionId].answer) : null
  })).filter(item => item.rating !== null);
  
  if (ratings.length === 0) return null;
  
  // 評価でソート
  ratings.sort((a, b) => {
    if (selectionType === 'highest') {
      return b.rating - a.rating;
    } else {
      return a.rating - b.rating;
    }
  });
  
  // 最高/最低評価を取得
  const targetRating = ratings[0].rating;
  
  // 同じ評価の項目を全て取得
  const topRatedItems = ratings.filter(item => item.rating === targetRating);
  
  // 同じ評価が複数ある場合は一貫性のある選択
  if (topRatedItems.length === 1) {
    return topRatedItems[0];
  }
  
  // 回答の組み合わせからシード値を生成（同じ回答なら常に同じ結果になる）
  const seedString = JSON.stringify(page2Answers);
  const seed = stringToSeed(seedString);
  const selectedIndex = seed % topRatedItems.length;
  
  console.log('Multiple items with same rating:', topRatedItems.length, 'Selected index:', selectedIndex);
  
  return topRatedItems[selectedIndex];
}

// メインの条件分岐ロジック
export function generatePage3Questions(page1Answers, page2Answers, page2AdditionalAnswer = null) {
  // 必要な回答を取得
  const npsScore = page1Answers['required_1_1']?.answer ? 
    parseInt(page1Answers['required_1_1'].answer) : null;
  // 再来店意向あり = 1ヶ月以内(1) または 3ヶ月以内(2)
  const revisitAnswer = page1Answers['required_1_2']?.answer;
  const willRevisit = revisitAnswer === '1' || revisitAnswer === '2';
  const visitHistory = page1Answers['required_1_3']?.answer;
  // 選択肢番号1が「初めて」なので、それ以外は経験あり
  const hasVisitedBefore = visitHistory !== '1' && visitHistory !== 'opt_1_3_1';
  
  // グループを判定
  const group = determineGroup(npsScore, willRevisit, hasVisitedBefore);
  
  if (!group) {
    console.error('Could not determine group from answers');
    return null;
  }
  
  // グループ別のルールを取得
  const groupRule = GROUP_QUESTION_RULES[group];
  
  // グループCの場合、追加質問の回答を確認
  let hasIssues = false;
  if (group === 'C' && page2AdditionalAnswer) {
    // 選択肢番号1が「はい」、2が「いいえ」
    hasIssues = page2AdditionalAnswer === '1' || page2AdditionalAnswer === 'opt_2_4_1';
  }
  
  // 評価項目を選択
  const selectionType = group === 'C' ? 
    groupRule.selectAspect(hasIssues) : 
    groupRule.selectAspect;
  
  const selectedAspect = selectAspectByRating(page2Answers, selectionType);
  
  if (!selectedAspect) {
    console.error('Could not select aspect for questions');
    return null;
  }
  
  // 質問タイプを決定
  const questionType = group === 'C' ?
    groupRule.questionType(hasIssues) :
    groupRule.questionType;
  
  // 質問を生成
  const questions = group === 'C' ?
    groupRule.generateQuestions(selectedAspect.aspect, hasIssues) :
    groupRule.generateQuestions(selectedAspect.aspect);
  
  return {
    group,
    selectedAspect: selectedAspect.aspect,
    selectedQuestionId: selectedAspect.questionId,
    selectedRating: selectedAspect.rating,
    questionType, // 'positive' or 'negative'
    questions
  };
}