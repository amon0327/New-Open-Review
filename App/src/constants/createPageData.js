import React from 'react';
import {
  TextFields,
  Description,
  RadioButtonChecked,
  CheckBox,
  ExpandMore,
  LinearScale,
  Image,
  Folder,
  Edit,
  Settings,
  AccountCircle,
  Storage,
  Security,
  Language,
  Notifications,
  CloudSync,
  ViewColumn,
  ViewList,
  Palette
} from '@mui/icons-material';

// 左ナビゲーションアイテムの定義
export const leftNavigationItems = [
  { icon: null, label: 'OpenReview', category: 'main', isLogo: true },
  { icon: <Folder />, label: 'フォルダー', category: 'main' },
  { icon: <Edit />, label: '編集', category: 'main' },
  { icon: <Settings />, label: '設定', category: 'main' }
];

// 質問タイプの定義
export const questionTypes = [
  { icon: <TextFields />, label: '短文回答', type: 'text' },
  { icon: <Description />, label: '長文回答', type: 'textarea' },
  { icon: <RadioButtonChecked />, label: '単一選択', type: 'radio' },
  { icon: <CheckBox />, label: '複数選択', type: 'checkbox' },
  { icon: <ViewColumn />, label: '単一選択(2列)', type: 'radio-2col' },
  { icon: <ViewList />, label: '複数選択(2列)', type: 'checkbox-2col' },
  { icon: <ExpandMore />, label: 'プルダウン', type: 'select' },
  { icon: <LinearScale />, label: '線形スケール', type: 'scale' },
  { icon: <LinearScale />, label: '推奨度スコア', type: 'loyalty_score' }
];

// テンプレート質問の定義
export const questionTemplates = [
  {
    id: 'business',
    title: 'ビジネス',
    expanded: false,
    categories: [
      {
        id: 'customer-satisfaction',
        title: '顧客満足度',
        expanded: false,
        templates: [
          { id: 'cs1', question: 'サービスの満足度を教えてください', type: 'scale' },
          { id: 'cs2', question: '改善点があれば教えてください', type: 'textarea' },
          { id: 'cs3', question: 'おすすめ度はいかがですか？', type: 'scale' },
          { id: 'cs4', question: '今後も利用したいですか？', type: 'radio' },
          { id: 'cs5', question: '他の人におすすめしますか？', type: 'scale' }
        ]
      },
      {
        id: 'employee-evaluation',
        title: '従業員評価',
        expanded: false,
        templates: [
          { id: 'emp1', question: '職場環境の満足度', type: 'scale' },
          { id: 'emp2', question: '上司とのコミュニケーション', type: 'radio' },
          { id: 'emp3', question: '改善してほしい点', type: 'textarea' },
          { id: 'emp4', question: '研修の有効性はいかがですか？', type: 'scale' },
          { id: 'emp5', question: '働きがいを感じますか？', type: 'radio' }
        ]
      }
    ]
  },
  {
    id: 'personal',
    title: '個人情報',
    expanded: false,
    categories: [
      {
        id: 'basic-info',
        title: '基本情報',
        expanded: false,
        templates: [
          { id: 'p1', question: 'お名前を教えてください', type: 'text' },
          { id: 'p2', question: '年齢を選択してください', type: 'select' },
          { id: 'p3', question: '性別を選択してください', type: 'radio' }
        ]
      },
      {
        id: 'contact-info',
        title: '連絡先情報',
        expanded: false,
        templates: [
          { id: 'p4', question: 'メールアドレス', type: 'text' },
          { id: 'p5', question: '電話番号', type: 'text' },
          { id: 'p6', question: '住所', type: 'textarea' }
        ]
      }
    ]
  },
  {
    id: 'education',
    title: '教育・研修',
    expanded: false,
    categories: [
      {
        id: 'course-evaluation',
        title: '講座評価',
        expanded: false,
        templates: [
          { id: 'edu1', question: '講座の理解度はいかがでしたか？', type: 'scale' },
          { id: 'edu2', question: '講師の説明は分かりやすかったですか？', type: 'radio' },
          { id: 'edu3', question: '今後学びたい内容', type: 'checkbox' },
          { id: 'edu4', question: '講座の難易度はいかがでしたか？', type: 'scale' },
          { id: 'edu5', question: '資料の分かりやすさ', type: 'scale' }
        ]
      }
    ]
  },
  {
    id: 'events',
    title: 'イベント',
    expanded: false,
    categories: [
      {
        id: 'event-feedback',
        title: 'イベントフィードバック',
        expanded: false,
        templates: [
          { id: 'evt1', question: 'イベントの満足度', type: 'scale' },
          { id: 'evt2', question: '最も良かったセッション', type: 'checkbox' },
          { id: 'evt3', question: '改善提案があれば教えてください', type: 'textarea' },
          { id: 'evt4', question: '来年も参加したいですか？', type: 'radio' },
          { id: 'evt5', question: '会場の環境はいかがでしたか？', type: 'scale' }
        ]
      }
    ]
  },
  {
    id: 'products',
    title: '製品・サービス',
    expanded: false,
    categories: [
      {
        id: 'product-feedback',
        title: '製品フィードバック',
        expanded: false,
        templates: [
          { id: 'prd1', question: '製品の使いやすさ', type: 'scale' },
          { id: 'prd2', question: '機能で最も重要なもの', type: 'checkbox' },
          { id: 'prd3', question: 'バグや問題を経験しましたか？', type: 'radio' },
          { id: 'prd4', question: '追加してほしい機能', type: 'textarea' },
          { id: 'prd5', question: '価格に対する満足度', type: 'scale' }
        ]
      }
    ]
  }
];

// 設定カテゴリデータ
export const settingsCategories = [
  {
    id: 'account',
    title: 'アカウント',
    description: 'プロフィールとアカウント設定',
    icon: <AccountCircle />,
    settings: [
      { id: 'profile', label: 'プロフィール編集', value: 'Claude User', type: 'text' },
      { id: 'email', label: 'メールアドレス', value: 'user@example.com', type: 'email' },
      { id: 'password', label: 'パスワード変更', value: '••••••••', type: 'password' },
      { id: 'avatar', label: 'アバター画像', value: 'アップロード', type: 'upload' }
    ]
  },
  {
    id: 'database',
    title: 'データベース',
    description: 'Supabase接続とデータ管理',
    icon: <Storage />,
    settings: [
      { id: 'connection', label: 'データベース接続', value: '接続済み', type: 'status', status: 'connected' },
      { id: 'tables', label: 'テーブル管理', value: '12テーブル', type: 'info' },
      { id: 'backup', label: '自動バックアップ', value: true, type: 'toggle' },
      { id: 'retention', label: 'データ保持期間', value: '90日', type: 'select' }
    ]
  },
  {
    id: 'forms',
    title: 'フォーム設定',
    description: 'フォームのデフォルト設定',
    icon: <Palette />,
    settings: [
      { id: 'theme-color', label: 'テーマカラー', value: '#5e17eb', type: 'color-picker' },
      { id: 'theme', label: 'デフォルトテーマ', value: 'モダン', type: 'select' },
      { id: 'language', label: '言語設定', value: '日本語', type: 'select' },
      { id: 'timezone', label: 'タイムゾーン', value: 'Asia/Tokyo', type: 'select' },
      { id: 'analytics', label: '分析機能', value: true, type: 'toggle' }
    ]
  },
  {
    id: 'security',
    title: 'セキュリティ',
    description: 'セキュリティとプライバシー設定',
    icon: <Security />,
    settings: [
      { id: '2fa', label: '二段階認証', value: '無効', type: 'status', status: 'disconnected' },
      { id: 'encryption', label: 'データ暗号化', value: true, type: 'toggle' },
      { id: 'sessions', label: 'アクティブセッション', value: '3セッション', type: 'info' },
      { id: 'activity-log', label: 'アクティビティログ', value: true, type: 'toggle' }
    ]
  },
  {
    id: 'integrations',
    title: '連携',
    description: '外部サービスとの連携設定',
    icon: <CloudSync />,
    settings: [
      { id: 'google', label: 'Google連携', value: '接続済み', type: 'status', status: 'connected' },
      { id: 'slack', label: 'Slack連携', value: '未接続', type: 'status', status: 'disconnected' },
      { id: 'webhook', label: 'Webhook URL', value: 'https://api...', type: 'info' },
      { id: 'notifications', label: '通知設定', value: true, type: 'toggle' }
    ]
  },
  {
    id: 'advanced',
    title: '高度な設定',
    description: '開発者向け設定',
    icon: <Settings />,
    settings: [
      { id: 'api-key', label: 'APIキー', value: 'sk-1234...', type: 'info' },
      { id: 'rate-limit', label: 'レート制限', value: '1000/時間', type: 'info' },
      { id: 'debug', label: 'デバッグモード', value: false, type: 'toggle' },
      { id: 'cache', label: 'キャッシュ設定', value: '有効', type: 'info' }
    ]
  }
];