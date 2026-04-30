// ========================================
// generate-analytics-insights (Phase 2)
// ----------------------------------------
// 3 段階 Agent パイプライン構成:
//   Stage A (Haiku 4.5)    : 異常検知 (anomaly extraction)
//   Stage B (Sonnet 4.6)   : 仮説生成 (hypothesis generation, with extended thinking)
//   Stage C (Opus 4.7)     : 物語化 + 深掘り (with thinking + tool use 多段)
//
// 入力データ:
//   - 当月コメント + 埋め込み (#9: comment_embeddings からクラスタリング)
//   - 当月/前月 セグメント別 QSC
//   - 店舗全体 QSC サマリ
//   - 過去 3 ヶ月のインサイト履歴 (#5: 慢性課題追跡)
//
// Stage C で AI が呼べるツール (#8):
//   - query_comments_by_keyword
//   - query_segment_qsc
//   - query_similar_comments  (#9 と連動)
//   - query_historical_trend
//   - submit_insights         (最終出力)
// ========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ========================================
// 定数
// ========================================
const QUALITY_LABELS = [
  '料理の味', '料理の見た目', '料理の量/ボリューム', 'ドリンクの味', 'ドリンクの温度',
  '食べたい料理', '飲みたいドリンク', 'メニューの種類', '料理・ドリンクの温度', '特徴や独自性',
]
const SERVICE_LABELS = [
  '入店時の挨拶', '席への案内', '注文時の対応', 'メニュー説明・提案', '提供スピード',
  '注文・提供の正確さ', 'スタッフの気配り', 'スタッフの笑顔', 'スタッフの言葉遣い', '特に良かったスタッフ',
]
const CLEANLINESS_LABELS = [
  '店舗外観・入口', 'テーブル', '椅子・ソファ', '床', '食器・カトラリー',
  'メニュー表・卓上備品', 'トイレ', '店内の空気や匂い', '店内の整理整頓', 'スタッフの身だしなみ',
]

const TYPE_NAMES: Record<number, string> = {
  1: '推奨者で再来店意向ありのリピーターのお客様',
  2: '推奨者で再来店意向ありの新規のお客様',
  3: '推奨者で再来店意向なしのリピーターのお客様',
  4: '推奨者で再来店意向なしの新規のお客様',
  5: '中立者で再来店意向ありのリピーターのお客様',
  6: '中立者で再来店意向ありの新規のお客様',
  7: '中立者で再来店意向なしのリピーターのお客様',
  8: '中立者で再来店意向なしの新規のお客様',
  9: '批判者で再来店意向ありのリピーターのお客様',
  10: '批判者で再来店意向ありの新規のお客様',
  11: '批判者で再来店意向なしのリピーターのお客様',
  12: '批判者で再来店意向なしの新規のお客様',
}

const MIN_CONFIDENCE = 0.7
const MIN_EVIDENCE_COUNT = 3
const CLUSTER_SIMILARITY_THRESHOLD = 0.78
const MAX_TOOL_TURNS = 8

// ========================================
// 共通: 役割定義 (全ステージのキャッシュ対象)
// ========================================
const ROLE_PREAMBLE = `あなたは飲食店の月次レポートのAIアナリストです。
読み手は店長(現場責任者)。データを見慣れておらず、抽象論ではなく「来月この店舗で何を変えるべきか」を求めています。

【本質的な目的】
このレポートの本質は「何かと何かを比較することによって今月この店舗の課題を可視化する」こと。
比較なきインサイトは出さない。比較で意味の出ないインサイトも出さない。

【主役は今月】
- 主役は「今月のこの店舗のデータ」
- 前月データや全体平均は今月の状況を客観的に理解するための比較材料
- 過去の問題点を列挙するのではなく、「今月はこうだった」「今月はこの点が特徴的だった」という今月の分析

【データの性質】
- このデータはアンケート調査結果。「回答数」は来店数ではなくアンケート回答数
- 回答数20件未満の指標は断定的に語らない
- 件数より比率(%)で語る

【セグメント名表記の絶対ルール】
- 「安定推奨層」「離脱リスク層」などの抽象的な内部名称は禁止。必ず「推奨者で再来店意向ありのリピーターのお客様」のように具体的な属性で記述する。
- 「type1」「type6」「(type5)」のような内部分類番号は**絶対に出力に含めない**。これは内部処理用のラベルであり、レポートを読む店長には何のことか分からない。
  - ✗ 悪い例: 「新規のお客様(type6)」「推奨者リピーター(type1)」「中立リピーター(type5)」
  - ✓ 良い例: 「中立者で再来店意向ありの新規のお客様」「推奨者で再来店意向ありのリピーターのお客様」
- 括弧書きで type 番号を補足することも禁止。属性名のみで記述すること。
- これは issue_title / issue_detail / current_title / previous_title / point_1〜3 / comment 等、**全ての出力フィールド** に適用する。`

// ========================================
// Stage A: 異常検知 用 system prompt
// ========================================
const SYSTEM_PROMPT_STAGE_A = `${ROLE_PREAMBLE}

【あなたの役割 (Stage A: 異常検知)】
あなたはパイプラインの最初の段階「異常検知」を担当します。
今月の店舗データを俯瞰し、「今月を特徴づける異常・乖離」を 5〜10 個ピックアップしてください。

【検出観点】
- コメントクラスタの新規出現 (前月になかったテーマの登場)
- 特定セグメントで他より大幅にネガが多い QSC 項目 (差 15pt 以上)
- 前月から大きく変化した指標 (5pt 以上)
- 全体平均から大きく乖離している指標
- 過去3ヶ月のインサイト履歴と比べて慢性化している/解消した項目

【ルール】
- 「明確な乖離・変化」のみを挙げる。曖昧なものは挙げない
- ポジティブ・ネガティブ両方を含めてよい
- 比較軸 (axis) を必ず1つ選ぶ: month_vs_month / segment_vs_overall / segment_vs_segment / qsc_item_relative
- magnitude は 1-10 で、その異常がどれだけ「今月を特徴づけているか」を表す
- submit_anomalies ツールで提出。形式厳守。`

const ANOMALIES_TOOL = {
  name: 'submit_anomalies',
  description: '今月を特徴づける異常・乖離の候補リストを提出する',
  input_schema: {
    type: 'object',
    properties: {
      anomalies: {
        type: 'array',
        maxItems: 10,
        items: {
          type: 'object',
          properties: {
            area: {
              type: 'string',
              enum: ['comment_theme', 'qsc_item', 'segment_metric', 'overall_metric', 'chronic_issue'],
              description: '異常の領域',
            },
            description: { type: 'string', description: '何が異常か(80文字以内、具体的に)' },
            magnitude: { type: 'integer', minimum: 1, maximum: 10, description: '今月を特徴づける度合い' },
            axis: {
              type: 'string',
              enum: ['month_vs_month', 'segment_vs_overall', 'segment_vs_segment', 'qsc_item_relative'],
            },
            related_segment_type: { type: 'integer', minimum: 1, maximum: 12, description: '関連セグメント(該当する場合)' },
            related_qsc_key: { type: 'string', description: '関連QSC項目キー(q1〜c10、該当する場合)' },
          },
          required: ['area', 'description', 'magnitude', 'axis'],
        },
      },
    },
    required: ['anomalies'],
  },
}

// ========================================
// Stage B: 仮説生成 用 system prompt
// ========================================
const SYSTEM_PROMPT_STAGE_B = `${ROLE_PREAMBLE}

【あなたの役割 (Stage B: 仮説生成)】
あなたはパイプラインの 2 段階目「仮説生成」を担当します。
Stage A の異常リストを受け取り、各異常について「なぜ起きているか」の仮説を立て、
本当に意味のあるインサイト候補だけを残してください。

【手順】
1. 各異常について、考えうる原因仮説を立てる
2. その仮説を支持する/反証する材料を、提供データから探す
3. 仮説に説得力があり、かつ店長が行動できそうなものだけ keep=true にする
4. 弱い仮説 (回答数が少ない / 比較が説得力に欠ける / 行動につながらない) は keep=false
5. 慢性化している項目は「過去3ヶ月のインサイト履歴」を踏まえて評価
   - 同じ課題が3ヶ月続いている → 強く扱う、進捗観点で語る
   - 過去にあったが今月解消 → ポジティブ寄りに扱う
6. submit_hypotheses ツールで提出

【keep の判定】
- データの裏付けが明確 (回答数 ≥ 5 件、または明確な数値乖離)
- 比較軸での意味が明確
- 改善アクションを店長が想像できる
これら全て満たすものだけ true。`

const HYPOTHESES_TOOL = {
  name: 'submit_hypotheses',
  description: 'Stage A の異常それぞれに仮説を立て、Stage C に渡す候補を選別する',
  input_schema: {
    type: 'object',
    properties: {
      hypotheses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            anomaly_idx: { type: 'integer', description: 'Stage A 出力リストでのインデックス(0始まり)' },
            anomaly_summary: { type: 'string', description: '対象異常の短い再記述' },
            hypothesis: { type: 'string', description: '原因仮説 (100〜200文字)' },
            supporting_evidence: { type: 'string', description: '提供データから見つかる支持材料' },
            chronic: { type: 'boolean', description: '過去3ヶ月のインサイトに類似のものがあるか' },
            keep: { type: 'boolean', description: 'Stage C に進めるか' },
            keep_reason: { type: 'string', description: 'keep の理由 (短く)' },
          },
          required: ['anomaly_idx', 'anomaly_summary', 'hypothesis', 'chronic', 'keep', 'keep_reason'],
        },
      },
    },
    required: ['hypotheses'],
  },
}

// ========================================
// Stage C: 物語化 + 深掘り 用 system prompt
// ========================================
const SYSTEM_PROMPT_STAGE_C = `${ROLE_PREAMBLE}

【あなたの役割 (Stage C: インサイト書き起こし + 深掘り)】
あなたはパイプラインの最終段階を担当します。
Stage B が選別した仮説候補を受け取り、必要なら追加データを自分でツール経由で取得して、
最終インサイトを最大4件、submit_insights ツールで提出してください。

【利用可能なツール】
- query_comments_by_keyword(keyword, limit?): 当月コメントのキーワード検索
- query_similar_comments(text, limit?): 当月コメントから意味的に類似したものを取得 (埋め込み類似度)
- query_segment_qsc(type): 特定セグメントの当月QSC全項目を取得
- query_historical_trend(metric, months?): 指定指標の直近Nヶ月推移を取得
- submit_insights(insights): 最終インサイトの提出 (これを呼ぶと完了)

【ツール使用方針】
- Stage B で支持材料が不十分な仮説は、関連コメントを keyword/similar で引いて検証する
- 数値が前月比で動いた場合は、historical_trend でトレンドが本物か確認
- 不要に深掘りせず、必要最小限の確認で済ませる (3-5 ツール呼び出しまでが目安)

【インサイトの絶対ルール】
- 比較軸 (comparison_axis) を必ず明示
- confidence (0-1) と evidence_count を必ず付与。confidence < 0.7 のものは出さない
- 「頑張りましょう」「意識を高めましょう」のような精神論は禁止
- 慢性化している課題は issue_title/issue_detail に「3ヶ月続いている」「2月から悪化」などの時系列文脈を含める

【point_1/point_2/point_3 の書式 (絶対遵守)】
店長への押し付けではなく「現状確認 → 条件分岐 → 提案」の柔らかい構造にすること。

書式テンプレ (必ずこの 3 要素で構成):
  「<現状を問う質問>？→ もし<条件節>場合、<具体提案>すると、<期待効果>。」

各要素の書き方:
  - 現状質問: 「〜は用意されていますか？」「〜は実施されていますか？」「〜は把握されていますか？」
  - 条件節: 「もし選択肢がない場合」「もし特定層に偏っている場合」「もし記載がない場合」「もし運用が属人的な場合」など
  - 具体提案: 数値や手段を含む実行可能なアクション (例: 「+200〜300円で大盛りオプションを追加」「グラム数や想定人数を表記」)
  - 期待効果: 「満足度を高めながら客単価向上も実現できます」「期待値のズレを防ぎ、不満を事前に回避できます」「効率的に改善できます」

良い例 (この形式):
  「現在のメニューに量の選択肢（普通盛り/大盛り等）は用意されていますか？→ もし選択肢がない場合、+200〜300円で大盛りオプションを追加すると、量を求める顧客層の満足度を高めながら客単価向上も実現できます。」
  「料理の量に関する不満は男性客や特定の年齢層に偏っていませんか？→ もし特定層に集中している場合、ターゲット層に合わせたボリュームゾーンのメニュー開発を検討することで、効率的に改善できます。」
  「メニュー表に各料理のグラム数や想定人数は明記されていますか？→ もし記載がない場合、「1〜2人前」「ボリューム満点」等の表記を追加すると、注文時の期待値のズレを防ぎ、不満を事前に回避できます。」

悪い例 (絶対に避ける — 命令形・「→」と条件節なし):
  ✗「ピーク時の常連客テーブルへの料理提供順は遅れていないか？ホール責任者が常連卓の着席時刻と提供時刻を1週間ログ化し、新規卓と比較して遅延の有無を可視化してください。」
  ✗「キッチンは新規客の注文を優先する暗黙ルールになっていないか？注文受付順に提供する原則を朝礼で再共有し、常連卓の伝票を後回しにしない運用を徹底してください。」
  → これらは命令形(〜してください)で押し付けがましく、また「もし〜の場合」の条件節がないため店長に判断の余地を与えていない。

修正後 (悪い例の良い書き換え):
  「ピーク時に常連客の料理提供が新規客より遅れる傾向はありますか？→ もし遅延が発生している場合、常連卓と新規卓の提供時刻を1週間ログ化して可視化すると、特定時間帯の優先順位ルール改善につながります。」

各 point は 80〜120 文字程度。「？→ もし」を必ず含むこと。

【evaluation 型の比較パターン】
- パターンA(segment_vs_overall): 特定セグメント vs それを除外した全体平均
  - previous_positive/previous_negative は概算で良い (サーバ側で再計算)
- パターンB(month_vs_month): 今月 vs 先月の同一項目

【QSC項目キー】
Quality: q1=料理の味, q2=料理の見た目, q3=料理の量/ボリューム, q4=ドリンクの味, q5=ドリンクの温度, q6=食べたい料理, q7=飲みたいドリンク, q8=メニューの種類, q9=料理・ドリンクの温度, q10=特徴や独自性
Service: s1=入店時の挨拶, s2=席への案内, s3=注文時の対応, s4=メニュー説明・提案, s5=提供スピード, s6=注文・提供の正確さ, s7=スタッフの気配り, s8=スタッフの笑顔, s9=スタッフの言葉遣い, s10=特に良かったスタッフ
Cleanliness: c1=店舗外観・入口, c2=テーブル, c3=椅子・ソファ, c4=床, c5=食器・カトラリー, c6=メニュー表・卓上備品, c7=トイレ, c8=店内の空気や匂い, c9=店内の整理整頓, c10=スタッフの身だしなみ

【12type 一覧】
${Object.entries(TYPE_NAMES).map(([k, v]) => `type ${k}: ${v}`).join('\n')}

【出力】
最大4件、信頼度0.7以上のみ。該当なしなら空配列。submit_insights を必ず呼ぶ。`

// ========================================
// Stage C 用ツール定義
// ========================================
const INSIGHTS_TOOL = {
  name: 'submit_insights',
  description: '最終インサイトを最大4件提出する。これを呼ぶと完了。',
  input_schema: {
    type: 'object',
    properties: {
      insights: {
        type: 'array',
        maxItems: 4,
        items: {
          type: 'object',
          properties: {
            issue_type: { type: 'string', enum: ['comment', 'evaluation'] },
            issue_title: { type: 'string', description: '20文字以内。「type1」「(type6)」のような内部番号表記は禁止。' },
            issue_detail: { type: 'string', description: '50〜200文字。「type1」「(type6)」のような内部番号表記は禁止。セグメントは具体的な属性名で記述。' },
            point_1: {
              type: 'string',
              description: '形式厳守: "<現状を問う質問>？→ もし<条件節>場合、<具体提案>すると、<期待効果>。" の3要素構成。命令形(〜してください)禁止。例: "メニューに量の選択肢は用意されていますか？→ もし選択肢がない場合、+200円で大盛りオプションを追加すると、満足度向上と客単価向上を両立できます。" 80〜120文字',
            },
            point_2: {
              type: 'string',
              description: '同上。質問→もし〜の場合→具体提案→期待効果。命令形禁止。',
            },
            point_3: {
              type: 'string',
              description: '同上。質問→もし〜の場合→具体提案→期待効果。命令形禁止。',
            },
            result_type: { type: 'integer', minimum: 1, maximum: 12 },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            evidence_count: { type: 'integer', minimum: 0 },
            comparison_axis: {
              type: 'string',
              enum: ['month_vs_month', 'segment_vs_overall', 'segment_vs_segment', 'qsc_item_relative'],
            },
            chronic: { type: 'boolean', description: '3ヶ月以上続いている課題か' },
            comment: { type: 'string', description: 'comment型: 代表コメント原文引用' },
            qsc_key: { type: 'string', description: 'evaluation型: q1〜c10' },
            comparison_type: { type: 'string', enum: ['segment_vs_overall', 'month_vs_month'] },
            current_title: { type: 'string', description: 'バーチャートのラベル。「type1」「(type6)」のような内部番号は禁止。例: 「中立リピーターの床評価」「1月の中立リピーターの床評価」' },
            current_positive: { type: 'integer' },
            current_negative: { type: 'integer' },
            previous_title: { type: 'string', description: 'バーチャートのラベル。「type1」「(type6)」のような内部番号は禁止。例: 「他セグメント全体の床評価」「12月の中立リピーターの床評価」' },
            previous_positive: { type: 'integer' },
            previous_negative: { type: 'integer' },
          },
          required: [
            'issue_type', 'issue_title', 'issue_detail',
            'point_1', 'point_2', 'point_3',
            'result_type', 'confidence', 'evidence_count', 'comparison_axis', 'chronic',
          ],
        },
      },
    },
    required: ['insights'],
  },
}

const QUERY_TOOLS = [
  {
    name: 'query_comments_by_keyword',
    description: '当月のコメントから指定キーワードを含むものを検索する',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '検索キーワード(部分一致)' },
        limit: { type: 'integer', minimum: 1, maximum: 30, default: 15 },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'query_similar_comments',
    description: '当月のコメントから意味的に類似したものを埋め込みベクトル検索で取得する',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '基準テキスト' },
        limit: { type: 'integer', minimum: 1, maximum: 30, default: 10 },
      },
      required: ['text'],
    },
  },
  {
    name: 'query_segment_qsc',
    description: '特定セグメントの当月 QSC 全項目を取得する',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'integer', minimum: 1, maximum: 12, description: '12type 番号' },
      },
      required: ['type'],
    },
  },
  {
    name: 'query_historical_trend',
    description: '指定指標の直近 N ヶ月の店舗の推移を取得する',
    input_schema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: [
            'nps_score', 'repeat_rate', 'repeater_revisit_rate', 'new_revisit_rate',
            'qsc_quality_score', 'qsc_service_score', 'qsc_cleanliness_score',
            'positive_impact_percent', 'negative_impact_percent',
          ],
        },
        months: { type: 'integer', minimum: 2, maximum: 12, default: 6 },
      },
      required: ['metric'],
    },
  },
]

// ========================================
// HTTP entry
// ========================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set')
    const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY') ?? '' // similar 検索用 (任意)

    let requestTargetYearMonth: string | null = null
    let storeIdsFilter: string[] | null = null
    try {
      const body = await req.json()
      requestTargetYearMonth = body?.target_year_month || null
      if (Array.isArray(body?.store_ids) && body.store_ids.length > 0) {
        storeIdsFilter = body.store_ids
      }
    } catch { /* no body */ }

    let targetYearMonth: string
    let prevYearMonth: string

    if (requestTargetYearMonth) {
      targetYearMonth = requestTargetYearMonth
      const [y, m] = targetYearMonth.split('-').map(Number)
      const prevDate = new Date(y, m - 2, 1)
      prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    } else {
      const now = new Date()
      const jstOffset = 9 * 60 * 60 * 1000
      const jstNow = new Date(now.getTime() + jstOffset)
      const targetDate = new Date(jstNow.getFullYear(), jstNow.getMonth() - 1, 1)
      targetYearMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
      const prevDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1)
      prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    }

    const [ty, tm] = targetYearMonth.split('-').map(Number)
    const jstOffset = 9 * 60 * 60 * 1000
    const monthStart = new Date(Date.UTC(ty, tm - 1, 1) - jstOffset)
    const monthEnd = new Date(Date.UTC(ty, tm, 0, 23, 59, 59, 999) - jstOffset)
    const [py, pm] = prevYearMonth.split('-').map(Number)
    const prevMonthStart = new Date(Date.UTC(py, pm - 1, 1) - jstOffset)
    const prevMonthEnd = new Date(Date.UTC(py, pm, 0, 23, 59, 59, 999) - jstOffset)

    console.log(`Generating insights for ${targetYearMonth} (3-stage pipeline)`)

    // 同期モード: ?wait=true もしくは body.wait=true で結果を待つ。デフォルトは fire-and-forget。
    const url = new URL(req.url)
    const waitForResult = url.searchParams.get('wait') === 'true'

    const runAll = async (): Promise<any[]> => {
      const { data: companies, error: companiesError } = await supabaseAdmin
        .from('companies')
        .select('id, name')
      if (companiesError) throw new Error(`Failed to fetch companies: ${companiesError.message}`)

      const tasks: Array<{ companyId: string; storeId: string; storeName: string }> = []
      for (const company of companies || []) {
        const { data: stores } = await supabaseAdmin
          .from('stores')
          .select('id, name')
          .eq('company_id', company.id)
        for (const store of stores || []) {
          if (storeIdsFilter && !storeIdsFilter.includes(store.id)) continue
          tasks.push({ companyId: company.id, storeId: store.id, storeName: store.name })
        }
      }
      if (storeIdsFilter) {
        console.log(`Filter active: targeting ${tasks.length} stores`)
      }

      // 並列度 3 で店舗を処理 (Anthropic レート制限と Edge Function CPU を考慮)
      const CONCURRENCY = 3
      const results: any[] = []
      for (let i = 0; i < tasks.length; i += CONCURRENCY) {
        const chunk = tasks.slice(i, i + CONCURRENCY)
        const chunkResults = await Promise.all(chunk.map(async (t) => {
          try {
            const insightCount = await processStoreInsights(
              supabaseAdmin, ANTHROPIC_API_KEY, VOYAGE_API_KEY,
              t.companyId, t.storeId, t.storeName,
              targetYearMonth, prevYearMonth,
              monthStart, monthEnd, prevMonthStart, prevMonthEnd
            )
            return { companyId: t.companyId, storeId: t.storeId, status: 'success', insightCount }
          } catch (e: any) {
            console.error(`Error processing store ${t.storeId}:`, e)
            return { companyId: t.companyId, storeId: t.storeId, status: 'error', message: e.message }
          }
        }))
        results.push(...chunkResults)
      }
      console.log(`[${targetYearMonth}] all done, ${results.length} stores`)
      return results
    }

    if (waitForResult) {
      // 同期モード (テスト・手動 invoke 用)
      const results = await runAll()
      return new Response(
        JSON.stringify({
          success: true,
          targetYearMonth,
          prevYearMonth,
          processedAt: new Date().toISOString(),
          results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 非同期モード: バックグラウンドで実行し、即レスポンス (cron 用)
    // @ts-ignore EdgeRuntime は Supabase Edge Function 環境のグローバル
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runAll().catch((e) => console.error('Background run failed:', e)))
    } else {
      // フォールバック (ローカル等): 待たずに開始だけして即返す
      runAll().catch((e) => console.error('Background run failed:', e))
    }
    return new Response(
      JSON.stringify({
        success: true,
        mode: 'async',
        targetYearMonth,
        prevYearMonth,
        startedAt: new Date().toISOString(),
        message: 'Processing in background. Poll monthly_analytics_issue for results.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 202 }
    )
  } catch (error: any) {
    console.error('Generate analytics insights error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// ========================================
// 店舗ごとのインサイト生成 (3 段階パイプライン)
// ========================================
async function processStoreInsights(
  supabase: any,
  anthropicKey: string,
  voyageKey: string,
  companyId: string,
  storeId: string,
  storeName: string,
  targetYearMonth: string,
  prevYearMonth: string,
  monthStart: Date,
  monthEnd: Date,
  prevMonthStart: Date,
  prevMonthEnd: Date
): Promise<number> {
  // ----------------------------------------
  // 1. データ取得
  // ----------------------------------------
  const { data: currentComments } = await supabase
    .from('preset_question_answer_comment')
    .select('id, comment, selected_qsc, question_number, is_positive, preset_question_answer!inner(p1_q1, p1_q2, p1_q3, store_id, company_id, created_at)')
    .eq('preset_question_answer.company_id', companyId)
    .eq('preset_question_answer.store_id', storeId)
    .gte('preset_question_answer.created_at', monthStart.toISOString())
    .lte('preset_question_answer.created_at', monthEnd.toISOString())

  const { data: prevComments } = await supabase
    .from('preset_question_answer_comment')
    .select('id, comment, selected_qsc, question_number, is_positive, preset_question_answer!inner(p1_q1, p1_q2, p1_q3, store_id, company_id, created_at)')
    .eq('preset_question_answer.company_id', companyId)
    .eq('preset_question_answer.store_id', storeId)
    .gte('preset_question_answer.created_at', prevMonthStart.toISOString())
    .lte('preset_question_answer.created_at', prevMonthEnd.toISOString())

  const { data: currentByType } = await supabase
    .from('monthly_analytics_summary_by_type')
    .select('*')
    .eq('company_id', companyId).eq('store_id', storeId).eq('year_month', targetYearMonth)

  const { data: prevByType } = await supabase
    .from('monthly_analytics_summary_by_type')
    .select('*')
    .eq('company_id', companyId).eq('store_id', storeId).eq('year_month', prevYearMonth)

  const { data: storeSummary } = await supabase
    .from('monthly_analytics_summary')
    .select('*')
    .eq('company_id', companyId).eq('store_id', storeId).eq('year_month', targetYearMonth)
    .maybeSingle()

  const allComments = currentComments || []
  if (allComments.length === 0 && (!currentByType || currentByType.length === 0)) {
    console.log(`Skipping store ${storeId}: no comments or type data`)
    return 0
  }

  // ----------------------------------------
  // 2. コメント整形 + 12type 分類
  // ----------------------------------------
  const enrichComment = (c: any) => {
    const ans = c.preset_question_answer
    return {
      id: c.id,
      comment: c.comment,
      selected_qsc: c.selected_qsc,
      question_number: c.question_number,
      is_positive: c.is_positive,
      type: classifyType(ans),
    }
  }
  const enrichedCurrent = allComments.map(enrichComment)
  const enrichedPrev = (prevComments || []).map(enrichComment)

  // ----------------------------------------
  // 3. 当月コメントの埋め込み取得 + クラスタリング (#9)
  // ----------------------------------------
  const commentIds = enrichedCurrent.map((c: any) => c.id).filter(Boolean)
  let embeddings: Map<string, number[]> = new Map()
  if (commentIds.length > 0) {
    const { data: embRows } = await supabase
      .from('comment_embeddings')
      .select('comment_id, embedding')
      .in('comment_id', commentIds)
    for (const row of embRows || []) {
      const v = parseEmbedding(row.embedding)
      if (v) embeddings.set(row.comment_id, v)
    }
  }
  const clusters = clusterComments(enrichedCurrent, embeddings, CLUSTER_SIMILARITY_THRESHOLD)
  console.log(`[${storeName}] ${enrichedCurrent.length} comments → ${clusters.length} clusters (${embeddings.size} embedded)`)

  // ----------------------------------------
  // 4. 過去 3 ヶ月のインサイト履歴 (#5)
  // ----------------------------------------
  const pastInsights = await fetchPastInsights(supabase, companyId, storeId, targetYearMonth, 3)

  // ----------------------------------------
  // 5. Stage A: 異常検知 (Haiku 4.5)
  // ----------------------------------------
  const stageAUserPrompt = buildStageAPrompt(
    storeName, targetYearMonth, prevYearMonth,
    clusters, enrichedPrev,
    currentByType || [], prevByType || [],
    storeSummary, pastInsights
  )
  console.log(`[${storeName}] Stage A: detecting anomalies...`)
  const stageAOut = await callClaudeStageA(anthropicKey, stageAUserPrompt)
  console.log(`[${storeName}] Stage A: ${stageAOut.anomalies?.length || 0} anomalies`)
  if (stageAOut.anomalies?.length) {
    console.log(`[${storeName}] Stage A first anomalies: ${JSON.stringify(stageAOut.anomalies.slice(0, 3)).slice(0, 600)}`)
  }

  if (!stageAOut.anomalies || stageAOut.anomalies.length === 0) {
    console.log(`[${storeName}] No anomalies detected, skipping`)
    return 0
  }

  // ----------------------------------------
  // 6. Stage B: 仮説生成 (Sonnet 4.6 + thinking)
  // ----------------------------------------
  const stageBUserPrompt = buildStageBPrompt(stageAOut.anomalies, pastInsights, storeName)
  console.log(`[${storeName}] Stage B: generating hypotheses...`)
  const stageBOut = await callClaudeStageB(anthropicKey, stageBUserPrompt)

  const allHypotheses = stageBOut.hypotheses || []
  const kept = allHypotheses.filter((h: any) => h.keep === true)
  console.log(`[${storeName}] Stage B: ${kept.length} kept of ${allHypotheses.length}`)
  if (allHypotheses.length > 0) {
    console.log(`[${storeName}] Stage B all hypotheses: ${JSON.stringify(allHypotheses.map((h: any) => ({ idx: h.anomaly_idx, keep: h.keep, reason: h.keep_reason }))).slice(0, 800)}`)
  } else {
    // 空配列 — Stage A の anomaly が hypothesis 化されなかった理由が不明
    console.log(`[${storeName}] Stage B returned EMPTY hypotheses despite ${stageAOut.anomalies?.length || 0} anomalies`)
  }

  if (kept.length === 0) {
    console.log(`[${storeName}] No hypotheses kept, skipping`)
    return 0
  }

  // ----------------------------------------
  // 7. Stage C: 物語化 + 深掘り (Opus 4.7 + thinking + tool use)
  // ----------------------------------------
  const dbContext: DbContext = {
    supabase,
    voyageKey,
    companyId,
    storeId,
    targetYearMonth,
    monthStart,
    monthEnd,
    enrichedCurrent,
    embeddings,
    currentByType: currentByType || [],
  }

  const stageCUserPrompt = buildStageCPrompt(
    stageAOut.anomalies, stageBOut.hypotheses, kept,
    storeName, targetYearMonth
  )
  console.log(`[${storeName}] Stage C: writing insights with tool access...`)
  const insightsRaw = await callClaudeStageC(anthropicKey, stageCUserPrompt, dbContext)

  // ----------------------------------------
  // 8. フィルタ + サーバ側補正 + 保存
  // ----------------------------------------
  let insights = insightsRaw.filter((ins: any) => {
    if ((ins.confidence ?? 0) < MIN_CONFIDENCE) {
      console.log(`[${storeName}] drop low-confidence: ${ins.issue_title}`)
      return false
    }
    if ((ins.evidence_count ?? 0) < MIN_EVIDENCE_COUNT) {
      console.log(`[${storeName}] drop low-evidence: ${ins.issue_title}`)
      return false
    }
    return true
  }).slice(0, 4)

  // パターンA(segment_vs_overall) の previous 値をサーバ側で再計算
  for (const insight of insights) {
    if (insight.issue_type === 'evaluation' && insight.comparison_type === 'segment_vs_overall' && insight.qsc_key && insight.result_type) {
      const td = (currentByType || []).find((t: any) => t.type === insight.result_type)
      if (td && storeSummary) {
        const key = insight.qsc_key
        const storeTotal = storeSummary[`${key}_total_count`] || 0
        const typeTotal = td[`${key}_total_count`] || 0
        const excludedTotal = storeTotal - typeTotal
        if (excludedTotal > 0) {
          const storePosCount = (storeSummary[`${key}_positive_percent`] || 0) * storeTotal / 100
          const typePosCount = (td[`${key}_positive_percent`] || 0) * typeTotal / 100
          const storeNegCount = (storeSummary[`${key}_negative_percent`] || 0) * storeTotal / 100
          const typeNegCount = (td[`${key}_negative_percent`] || 0) * typeTotal / 100
          insight.previous_positive = clampPct(Math.round((storePosCount - typePosCount) / excludedTotal * 100))
          insight.previous_negative = clampPct(Math.round((storeNegCount - typeNegCount) / excludedTotal * 100))
        }
      }
    }
    delete insight.qsc_key
    delete insight.comparison_type
  }

  await supabase.from('monthly_analytics_issue').delete()
    .eq('company_id', companyId).eq('store_id', storeId).eq('year_month', targetYearMonth)

  for (const insight of insights) {
    const insertData: any = {
      company_id: companyId,
      store_id: storeId,
      year_month: targetYearMonth,
      issue_type: insight.issue_type || 'comment',
      issue_title: insight.issue_title || '',
      issue_detail: insight.issue_detail || '',
      result_type: insight.result_type || null,
      point_1: insight.point_1 || null,
      point_2: insight.point_2 || null,
      point_3: insight.point_3 || null,
      comparison_axis: insight.comparison_axis || null,
      chronic: insight.chronic ?? null,
      confidence: typeof insight.confidence === 'number' ? insight.confidence : null,
      evidence_count: typeof insight.evidence_count === 'number' ? insight.evidence_count : null,
    }
    if (insight.issue_type === 'comment') {
      insertData.comment = insight.comment || null
    }
    if (insight.issue_type === 'evaluation') {
      insertData.current_title = insight.current_title || null
      insertData.current_positive = insight.current_positive || null
      insertData.current_negative = insight.current_negative || null
      insertData.previous_title = insight.previous_title || null
      insertData.previous_positive = insight.previous_positive || null
      insertData.previous_negative = insight.previous_negative || null
    }
    const { error } = await supabase.from('monthly_analytics_issue').insert(insertData)
    if (error) console.error(`[${storeName}] insert insight failed:`, error.message)
  }

  console.log(`[${storeName}] Saved ${insights.length} insights`)
  return insights.length
}

// ========================================
// 12type 分類
// ========================================
function classifyType(answer: any): number {
  const nps = answer?.p1_q1
  const revisit = answer?.p1_q2
  const customerType = answer?.p1_q3
  const isPromoter = nps >= 9
  const isPassive = nps >= 7 && nps <= 8
  const isRevisit = revisit === '1ヶ月以内' || revisit === '3ヶ月以内'
  const isRepeater = customerType !== '初めて'
  if (isPromoter && isRevisit && isRepeater) return 1
  if (isPromoter && isRevisit && !isRepeater) return 2
  if (isPromoter && !isRevisit && isRepeater) return 3
  if (isPromoter && !isRevisit && !isRepeater) return 4
  if (isPassive && isRevisit && isRepeater) return 5
  if (isPassive && isRevisit && !isRepeater) return 6
  if (isPassive && !isRevisit && isRepeater) return 7
  if (isPassive && !isRevisit && !isRepeater) return 8
  if (isRevisit && isRepeater) return 9
  if (isRevisit && !isRepeater) return 10
  if (!isRevisit && isRepeater) return 11
  return 12
}

// ========================================
// 埋め込みパース (pgvector は文字列 "[0.1, 0.2, ...]" として返ることがある)
// ========================================
function parseEmbedding(raw: any): number[] | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw as number[]
  if (typeof raw === 'string') {
    try {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr
    } catch { /* fallthrough */ }
    // "(0.1,0.2,...)" や "[0.1,0.2,...]" 形式
    const inner = raw.replace(/^[\[\(]/, '').replace(/[\]\)]$/, '')
    const arr = inner.split(',').map((s: string) => parseFloat(s.trim()))
    if (arr.every((n) => Number.isFinite(n))) return arr
  }
  return null
}

// ========================================
// クラスタリング (Union-Find with cosine similarity)
// ========================================
function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  if (denom === 0) return 0
  return dot / denom
}

interface CommentItem {
  id: string
  comment: string
  selected_qsc: any
  question_number: any
  is_positive: any
  type: number
}

interface Cluster {
  cluster_id: number
  size: number
  representative: CommentItem
  members: CommentItem[]
  dominant_type: number
  positive_count: number
  negative_count: number
}

function clusterComments(
  comments: CommentItem[],
  embeddings: Map<string, number[]>,
  threshold: number
): Cluster[] {
  if (comments.length === 0) return []
  // Union-Find
  const parent: number[] = comments.map((_, i) => i)
  const find = (x: number): number => parent[x] === x ? x : (parent[x] = find(parent[x]))
  const union = (a: number, b: number) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb }

  // 埋め込みありのものだけペアワイズ比較
  const withEmb: { idx: number; vec: number[] }[] = []
  for (let i = 0; i < comments.length; i++) {
    const v = embeddings.get(comments[i].id)
    if (v && v.length > 0) withEmb.push({ idx: i, vec: v })
  }

  for (let i = 0; i < withEmb.length; i++) {
    for (let j = i + 1; j < withEmb.length; j++) {
      const sim = cosine(withEmb[i].vec, withEmb[j].vec)
      if (sim >= threshold) union(withEmb[i].idx, withEmb[j].idx)
    }
  }

  // クラスタ集約
  const groups: Map<number, number[]> = new Map()
  for (let i = 0; i < comments.length; i++) {
    const r = find(i)
    if (!groups.has(r)) groups.set(r, [])
    groups.get(r)!.push(i)
  }

  const clusters: Cluster[] = []
  let cidCounter = 0
  for (const [, idxs] of groups) {
    const members = idxs.map((i) => comments[i])
    // 代表は最も中心に近い (他とのコサイン類似度平均が最大) もの。埋め込みなければ最初のメンバ
    let rep = members[0]
    if (idxs.length > 1) {
      let bestAvg = -Infinity
      for (const i of idxs) {
        const vi = embeddings.get(comments[i].id)
        if (!vi) continue
        let s = 0, n = 0
        for (const j of idxs) {
          if (j === i) continue
          const vj = embeddings.get(comments[j].id)
          if (!vj) continue
          s += cosine(vi, vj); n++
        }
        const avg = n > 0 ? s / n : -Infinity
        if (avg > bestAvg) { bestAvg = avg; rep = comments[i] }
      }
    }
    // 主要 type
    const typeCount: Record<number, number> = {}
    members.forEach((m) => { typeCount[m.type] = (typeCount[m.type] || 0) + 1 })
    const dominantType = Number(Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0][0])
    const positive_count = members.filter((m) => m.is_positive === true).length
    const negative_count = members.filter((m) => m.is_positive === false).length

    clusters.push({
      cluster_id: cidCounter++,
      size: members.length,
      representative: rep,
      members,
      dominant_type: dominantType,
      positive_count,
      negative_count,
    })
  }
  // 大きい順
  clusters.sort((a, b) => b.size - a.size)
  return clusters
}

// ========================================
// 過去 N ヶ月のインサイト履歴 (#5)
// ========================================
async function fetchPastInsights(
  supabase: any,
  companyId: string,
  storeId: string,
  currentYearMonth: string,
  months: number
): Promise<any[]> {
  const [y, m] = currentYearMonth.split('-').map(Number)
  const candidates: string[] = []
  for (let i = 1; i <= months; i++) {
    const d = new Date(y, m - 1 - i, 1)
    candidates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const { data, error } = await supabase
    .from('monthly_analytics_issue')
    .select('year_month, issue_type, issue_title, issue_detail')
    .eq('company_id', companyId)
    .eq('store_id', storeId)
    .in('year_month', candidates)
    .order('year_month', { ascending: false })

  if (error) {
    console.error('Failed to fetch past insights:', error.message)
    return []
  }
  return data || []
}

// ========================================
// プロンプトビルダー
// ========================================
function buildStageAPrompt(
  storeName: string,
  targetYearMonth: string,
  prevYearMonth: string,
  clusters: Cluster[],
  prevComments: any[],
  currentByType: any[],
  prevByType: any[],
  storeSummary: any,
  pastInsights: any[]
): string {
  return `店舗「${storeName}」の${targetYearMonth}データを俯瞰し、submit_anomalies で異常リストを提出してください。

=== 当月コメントクラスタ (${clusters.length}個) ===
${formatClusters(clusters)}

=== 前月コメント (テーマ把握用、上位件数) ===
${formatPrevTopComments(prevComments)}

=== 店舗全体QSC(今月) ===
${formatStoreSummary(storeSummary)}

=== セグメント別QSC(今月) ===
${formatQscByType(currentByType)}

=== セグメント別QSC(前月) ===
${formatQscByType(prevByType)}

=== 過去3ヶ月のインサイト履歴 ===
${formatPastInsights(pastInsights)}
`
}

function buildStageBPrompt(anomalies: any[], pastInsights: any[], storeName: string): string {
  return `Stage A が検出した異常リストを評価し、submit_hypotheses で各々に仮説を立てて keep を判定してください。

=== Stage A の異常リスト ===
${anomalies.map((a, i) => `[${i}] area=${a.area} axis=${a.axis} mag=${a.magnitude}\n   ${a.description}\n   ${a.related_segment_type ? `seg=${a.related_segment_type}` : ''} ${a.related_qsc_key ? `qsc=${a.related_qsc_key}` : ''}`).join('\n\n')}

=== 過去3ヶ月のインサイト履歴 (慢性化判定用) ===
${formatPastInsights(pastInsights)}

店舗名: ${storeName}
`
}

function buildStageCPrompt(
  anomalies: any[],
  hypotheses: any[],
  kept: any[],
  storeName: string,
  yearMonth: string
): string {
  const keptText = kept.map((h, i) => {
    const ano = anomalies[h.anomaly_idx] || {}
    return `[候補${i}] anomaly_axis=${ano.axis} ${h.chronic ? '【慢性化】' : ''}
  異常: ${h.anomaly_summary}
  仮説: ${h.hypothesis}
  支持材料: ${h.supporting_evidence || '(要追加検証)'}
  keep理由: ${h.keep_reason}`
  }).join('\n\n')

  return `店舗「${storeName}」の${yearMonth}インサイトを最大4件、submit_insights で提出してください。

=== Stage B が選別した候補 ===
${keptText}

【作業手順】
1. 各候補について、必要なら query_xxx ツールで追加データ確認
2. 信頼度0.7以上で、比較軸が明確で、店長が行動できるものだけ採用
3. 慢性化している課題は issue_detail に時系列文脈 (例: 「3月から続いている」) を含める
4. submit_insights を呼んで完了

注意: ツールは合計5回程度までを目安に。深掘りしすぎない。`
}

// ========================================
// フォーマッタ
// ========================================
function formatClusters(clusters: Cluster[]): string {
  if (clusters.length === 0) return '(コメントなし)'
  return clusters.slice(0, 20).map((c) => {
    const typeName = TYPE_NAMES[c.dominant_type] || `type${c.dominant_type}`
    const sentiment = c.positive_count > c.negative_count ? '👍優勢' : c.negative_count > c.positive_count ? '👎優勢' : '➖中立'
    const sample = c.members.slice(0, 3).map((m) => `    "${m.comment}"`).join('\n')
    return `[クラスタ#${c.cluster_id}] ${c.size}件 (主に${typeName}, ${sentiment}, ポジ${c.positive_count}/ネガ${c.negative_count})
  代表: "${c.representative.comment}"
  例:
${sample}`
  }).join('\n\n')
}

function formatPrevTopComments(comments: any[]): string {
  if (!comments || comments.length === 0) return '(なし)'
  return comments.slice(0, 15).map((c) => {
    const s = c.is_positive === true ? '👍' : c.is_positive === false ? '👎' : '➖'
    return `  ${s} "${c.comment}"`
  }).join('\n')
}

function formatStoreSummary(s: any): string {
  if (!s) return '(なし)'
  let out = `回答数: ${s.total_responses}\n`
  out += `Quality:\n` + qscBlock(s, 'q', QUALITY_LABELS)
  out += `Service:\n` + qscBlock(s, 's', SERVICE_LABELS)
  out += `Cleanliness:\n` + qscBlock(s, 'c', CLEANLINESS_LABELS)
  return out
}

function qscBlock(src: any, prefix: string, labels: string[]): string {
  let out = ''
  for (let i = 1; i <= 10; i++) {
    const pos = src[`${prefix}${i}_positive_percent`] || 0
    const neg = src[`${prefix}${i}_negative_percent`] || 0
    const total = src[`${prefix}${i}_total_count`] || 0
    if (total > 0) out += `  ${labels[i - 1]}: ポジ${pos}% / ネガ${neg}% (${total}件)\n`
  }
  return out
}

function formatQscByType(typeData: any[]): string {
  if (!typeData || typeData.length === 0) return '(なし)'
  return typeData.map((td: any) => {
    const name = TYPE_NAMES[td.type] || `type${td.type}`
    let out = `\n【${name}】(回答数: ${td.total_responses})\n`
    out += `Quality:\n` + qscBlock(td, 'q', QUALITY_LABELS)
    out += `Service:\n` + qscBlock(td, 's', SERVICE_LABELS)
    out += `Cleanliness:\n` + qscBlock(td, 'c', CLEANLINESS_LABELS)
    return out
  }).join('')
}

function formatPastInsights(past: any[]): string {
  if (past.length === 0) return '(過去履歴なし)'
  return past.map((p) => `[${p.year_month}] (${p.issue_type}) ${p.issue_title}: ${p.issue_detail}`).join('\n')
}

// ========================================
// Stage A: Haiku 4.5 呼び出し
// ========================================
async function callClaudeStageA(apiKey: string, userPrompt: string): Promise<any> {
  const data = await callAnthropic(apiKey, {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    system: [{ type: 'text', text: SYSTEM_PROMPT_STAGE_A, cache_control: { type: 'ephemeral' } }],
    tools: [ANOMALIES_TOOL],
    tool_choice: { type: 'tool', name: 'submit_anomalies' },
    messages: [{ role: 'user', content: userPrompt }],
  })
  const tu = (data.content || []).find((c: any) => c.type === 'tool_use')
  return tu?.input || { anomalies: [] }
}

// ========================================
// Stage B: Sonnet 4.6 + thinking 呼び出し
// 1段目で空配列ならフォールバック (fresh call、no thinking、forced tool)
// ========================================
async function callClaudeStageB(apiKey: string, userPrompt: string): Promise<any> {
  // 1段目: thinking + auto (深い推論で hypotheses を生成)
  const data = await callAnthropic(apiKey, {
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    thinking: { type: 'adaptive' },
    system: [{ type: 'text', text: SYSTEM_PROMPT_STAGE_B, cache_control: { type: 'ephemeral' } }],
    tools: [HYPOTHESES_TOOL],
    tool_choice: { type: 'auto' },
    messages: [{ role: 'user', content: userPrompt }],
  })
  const tu = (data.content || []).find((c: any) => c.type === 'tool_use')
  // tool が呼ばれて、かつ非空配列が返ったら採用
  if (tu?.input?.hypotheses && Array.isArray(tu.input.hypotheses) && tu.input.hypotheses.length > 0) {
    return tu.input
  }

  // 2段目フォールバック: 全く新しい呼び出し (thinking 無効、tool_choice 強制)
  // 注: thinking ブロック付き assistant メッセージは thinking 無効リクエストで replay 不可。
  // よってここでは元の userPrompt をそのまま強い指示と共に再投入する。
  const reason = !tu ? `no tool_use (stop_reason=${data.stop_reason})` : 'empty hypotheses array'
  console.warn(`[Stage B] fallback triggered: ${reason}`)
  const fallbackPrompt = `${userPrompt}

【重要・絶対遵守】
Stage A の異常リストに含まれる**全ての**異常について、必ず1つずつ仮説を作成して submit_hypotheses ツールで提出してください。
- 弱いと判断したものは keep=false にしてください (リストから外すのではなく)
- 仮説リストは空であってはいけません。Stage A の異常数と同じ数の仮説エントリを必ず含めてください
- 各仮説は anomaly_idx を Stage A のインデックスに合わせて記載すること`
  try {
    const data2 = await callAnthropic(apiKey, {
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      system: [{ type: 'text', text: SYSTEM_PROMPT_STAGE_B, cache_control: { type: 'ephemeral' } }],
      tools: [HYPOTHESES_TOOL],
      tool_choice: { type: 'tool', name: 'submit_hypotheses' },
      messages: [{ role: 'user', content: fallbackPrompt }],
    })
    const tu2 = (data2.content || []).find((c: any) => c.type === 'tool_use')
    if (tu2?.input) {
      console.log(`[Stage B] fallback returned ${tu2.input.hypotheses?.length || 0} hypotheses`)
      return tu2.input
    }
  } catch (e: any) {
    console.error('[Stage B] fallback failed:', e.message)
  }
  return { hypotheses: [] }
}

// ========================================
// Stage C: Opus 4.7 + thinking + tool use 多段
// ========================================
interface DbContext {
  supabase: any
  voyageKey: string
  companyId: string
  storeId: string
  targetYearMonth: string
  monthStart: Date
  monthEnd: Date
  enrichedCurrent: CommentItem[]
  embeddings: Map<string, number[]>
  currentByType: any[]
}

async function callClaudeStageC(
  apiKey: string,
  userPrompt: string,
  dbContext: DbContext
): Promise<any[]> {
  const messages: any[] = [{ role: 'user', content: userPrompt }]
  let finalInsights: any[] = []
  let submitCalled = false
  let lastContent: any[] = []

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const data = await callAnthropic(apiKey, {
      model: 'claude-opus-4-7',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: [{ type: 'text', text: SYSTEM_PROMPT_STAGE_C, cache_control: { type: 'ephemeral' } }],
      tools: [INSIGHTS_TOOL, ...QUERY_TOOLS],
      // 注: thinking 有効時は tool_choice で強制不可。auto に固定し、
      // submit_insights が呼ばれない場合は下のフォールバックで補完。
      tool_choice: { type: 'auto' },
      messages,
    })

    const content = data.content || []
    lastContent = content
    const toolUses = content.filter((c: any) => c.type === 'tool_use')
    const submit = toolUses.find((t: any) => t.name === 'submit_insights')
    if (submit) {
      finalInsights = Array.isArray(submit.input?.insights) ? submit.input.insights : []
      submitCalled = true
      break
    }

    if (toolUses.length === 0) {
      // 推論を続けたい / submit を呼ばずに end_turn → フォールバックで強制パッケージング
      console.warn(`[Stage C] no tool_use in turn ${turn} (stop_reason=${data.stop_reason}), forcing submit_insights`)
      messages.push({ role: 'assistant', content })
      break
    }

    // assistant メッセージを履歴に追加 (thinking ブロックも含めてそのまま)
    messages.push({ role: 'assistant', content })

    // 各ツールを実行して tool_result を返す
    const toolResults: any[] = []
    for (const tu of toolUses) {
      try {
        const result = await execTool(tu.name, tu.input, dbContext)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: typeof result === 'string' ? result : JSON.stringify(result),
        })
      } catch (e: any) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          is_error: true,
          content: `Error: ${e.message}`,
        })
      }
    }
    messages.push({ role: 'user', content: toolResults })
  }

  // フォールバック: submit_insights が呼ばれなかった場合、
  // thinking 無効化で tool_choice を強制してパッケージングを完了させる。
  // 注: thinking 無効リクエストには thinking ブロックを含む assistant メッセージは送れないので、
  //     既存履歴から thinking ブロックを剥がす。
  if (!submitCalled) {
    try {
      const sanitizedMessages = messages.map((m: any) => {
        if (m.role !== 'assistant' || !Array.isArray(m.content)) return m
        return {
          role: 'assistant',
          content: m.content.filter((c: any) => c.type !== 'thinking' && c.type !== 'redacted_thinking'),
        }
      })
      sanitizedMessages.push({
        role: 'user',
        content: 'これまでの分析を踏まえ、submit_insights ツールを呼び出して最終インサイトを提出してください。条件 (信頼度0.7以上) を満たすものが無ければ空配列で構いません。',
      })
      const data = await callAnthropic(apiKey, {
        model: 'claude-opus-4-7',
        max_tokens: 8000,
        // thinking 無し → tool_choice 強制可能
        system: [{ type: 'text', text: SYSTEM_PROMPT_STAGE_C, cache_control: { type: 'ephemeral' } }],
        tools: [INSIGHTS_TOOL],
        tool_choice: { type: 'tool', name: 'submit_insights' },
        messages: sanitizedMessages,
      })
      const tu = (data.content || []).find((c: any) => c.type === 'tool_use')
      if (tu?.input?.insights && Array.isArray(tu.input.insights)) {
        finalInsights = tu.input.insights
        console.log(`[Stage C] fallback recovered ${finalInsights.length} insights`)
      }
    } catch (e: any) {
      console.error('[Stage C] fallback failed:', e.message)
    }
  }

  return finalInsights
}

// ========================================
// Stage C ツール実行
// ========================================
async function execTool(name: string, args: any, ctx: DbContext): Promise<any> {
  switch (name) {
    case 'query_comments_by_keyword': return execQueryByKeyword(args, ctx)
    case 'query_similar_comments':    return execQuerySimilar(args, ctx)
    case 'query_segment_qsc':         return execQuerySegmentQsc(args, ctx)
    case 'query_historical_trend':    return execQueryHistoricalTrend(args, ctx)
    default: throw new Error(`Unknown tool: ${name}`)
  }
}

function execQueryByKeyword(args: any, ctx: DbContext) {
  const kw = String(args?.keyword || '').toLowerCase()
  const limit = Math.min(args?.limit ?? 15, 30)
  if (!kw) return { results: [], note: 'empty keyword' }
  const matches = ctx.enrichedCurrent.filter((c) => (c.comment || '').toLowerCase().includes(kw)).slice(0, limit)
  return {
    keyword: kw,
    found: matches.length,
    results: matches.map((c) => ({
      type: c.type,
      type_name: TYPE_NAMES[c.type],
      sentiment: c.is_positive === true ? 'positive' : c.is_positive === false ? 'negative' : 'neutral',
      qsc: c.selected_qsc,
      question: c.question_number,
      comment: c.comment,
    })),
  }
}

async function execQuerySimilar(args: any, ctx: DbContext) {
  const text = String(args?.text || '')
  const limit = Math.min(args?.limit ?? 10, 30)
  if (!text || !ctx.voyageKey) {
    // フォールバック: テキスト一致でアプローチ
    return execQueryByKeyword({ keyword: text.slice(0, 10), limit }, ctx)
  }
  // 入力テキストを Voyage で埋め込み、当月コメントの埋め込みとコサイン類似度比較
  let queryVec: number[]
  try {
    const r = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ctx.voyageKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'voyage-3', input: text, input_type: 'query' }),
    })
    if (!r.ok) {
      const errBody = await r.text()
      throw new Error(`voyage API ${r.status}: ${errBody.slice(0, 200)}`)
    }
    const j = await r.json()
    queryVec = j.data[0].embedding
  } catch (e: any) {
    return { error: `embedding failed: ${e.message}`, fallback: 'use query_comments_by_keyword' }
  }

  const scored: any[] = []
  for (const c of ctx.enrichedCurrent) {
    const v = ctx.embeddings.get(c.id)
    if (!v) continue
    scored.push({ c, sim: cosine(queryVec, v) })
  }
  scored.sort((a, b) => b.sim - a.sim)
  const top = scored.slice(0, limit)
  return {
    query: text,
    found: top.length,
    results: top.map(({ c, sim }) => ({
      similarity: Math.round(sim * 1000) / 1000,
      type: c.type,
      sentiment: c.is_positive === true ? 'positive' : c.is_positive === false ? 'negative' : 'neutral',
      qsc: c.selected_qsc,
      comment: c.comment,
    })),
  }
}

function execQuerySegmentQsc(args: any, ctx: DbContext) {
  const t = Number(args?.type)
  if (!t || t < 1 || t > 12) return { error: 'invalid type' }
  const td = ctx.currentByType.find((x: any) => x.type === t)
  if (!td) return { found: false, type: t, type_name: TYPE_NAMES[t] }
  const out: any = {
    type: t,
    type_name: TYPE_NAMES[t],
    total_responses: td.total_responses,
    quality: {}, service: {}, cleanliness: {},
  }
  for (let i = 1; i <= 10; i++) {
    if ((td[`q${i}_total_count`] || 0) > 0) out.quality[`q${i}`] = { label: QUALITY_LABELS[i - 1], pos: td[`q${i}_positive_percent`], neg: td[`q${i}_negative_percent`], total: td[`q${i}_total_count`] }
    if ((td[`s${i}_total_count`] || 0) > 0) out.service[`s${i}`] = { label: SERVICE_LABELS[i - 1], pos: td[`s${i}_positive_percent`], neg: td[`s${i}_negative_percent`], total: td[`s${i}_total_count`] }
    if ((td[`c${i}_total_count`] || 0) > 0) out.cleanliness[`c${i}`] = { label: CLEANLINESS_LABELS[i - 1], pos: td[`c${i}_positive_percent`], neg: td[`c${i}_negative_percent`], total: td[`c${i}_total_count`] }
  }
  return out
}

async function execQueryHistoricalTrend(args: any, ctx: DbContext) {
  const metric = String(args?.metric || '')
  const months = Math.min(Math.max(args?.months ?? 6, 2), 12)
  const [y, m] = ctx.targetYearMonth.split('-').map(Number)
  const ymList: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    ymList.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const { data, error } = await ctx.supabase
    .from('monthly_analytics_summary')
    .select(`year_month, ${metric}`)
    .eq('company_id', ctx.companyId)
    .eq('store_id', ctx.storeId)
    .in('year_month', ymList)
    .order('year_month', { ascending: true })
  if (error) return { error: error.message }
  return { metric, months, trend: data || [] }
}

// ========================================
// Anthropic API 共通呼び出し
// ========================================
async function callAnthropic(apiKey: string, body: any): Promise<any> {
  // 一時的エラー (5xx, 429, ネットワーク) は指数バックオフで最大 4 回リトライ
  const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504, 529])
  const MAX_ATTEMPTS = 4
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      })
      if (r.ok) return await r.json()

      const errBody = await r.text()
      const errMsg = `Anthropic API ${r.status}: ${errBody.slice(0, 500)}`

      if (RETRYABLE_STATUSES.has(r.status) && attempt < MAX_ATTEMPTS) {
        const wait = Math.min(30000, 1000 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 1000)
        console.warn(`Retryable ${r.status}, attempt ${attempt}/${MAX_ATTEMPTS}, waiting ${wait}ms`)
        await new Promise((res) => setTimeout(res, wait))
        lastError = new Error(errMsg)
        continue
      }
      throw new Error(errMsg)
    } catch (e: any) {
      // ネットワークエラーもリトライ
      const isNetworkError = e?.name === 'TypeError' || /fetch|network|aborted|timeout/i.test(e?.message || '')
      if (isNetworkError && attempt < MAX_ATTEMPTS) {
        const wait = Math.min(30000, 1000 * Math.pow(2, attempt - 1))
        console.warn(`Network error, attempt ${attempt}/${MAX_ATTEMPTS}, waiting ${wait}ms: ${e.message}`)
        await new Promise((res) => setTimeout(res, wait))
        lastError = e
        continue
      }
      throw e
    }
  }
  throw lastError || new Error('Anthropic API failed after retries')
}

// ========================================
// 小ヘルパー
// ========================================
function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, Math.round(n)))
}
