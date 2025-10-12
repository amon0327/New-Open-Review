# Edge Functions デプロイ手順

## 前提条件
```bash
# Supabase CLI がインストールされていることを確認
npx supabase --version

# プロジェクトにログイン
npx supabase login
```

## デプロイコマンド
```bash
# プロジェクトディレクトリに移動
cd /Users/omohi.yuuto/Documents/OpenReview/OpenReviewApp/App

# Edge Functions をデプロイ
npx supabase functions deploy create-staff-invitation
npx supabase functions deploy complete-staff-invitation
```

## 環境変数の確認
Supabase ダッシュボードで以下の環境変数が設定されていることを確認：

1. **SUPABASE_URL**: プロジェクトURL
2. **SUPABASE_ANON_KEY**: 匿名キー  
3. **SUPABASE_SERVICE_ROLE_KEY**: サービスロールキー ⭐ 重要

## デプロイ後のテスト
1. 店舗詳細ページで「スタッフを招待」をクリック
2. 名前とロールを入力して招待作成
3. 生成されたURLでログインテスト

## トラブルシューティング
- `Failed to send a request to the Edge Function` → 関数がデプロイされていない
- `Authentication error` → SUPABASE_SERVICE_ROLE_KEY が設定されていない
- `Permission denied` → RLS ポリシーの問題