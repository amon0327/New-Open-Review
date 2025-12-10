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
  Palette,
  Apps
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