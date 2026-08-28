#!/bin/bash

# Supabase Edge Function デプロイスクリプト

echo "=== Supabase Edge Function デプロイ ==="
echo ""
echo "1. まず、Supabase Dashboardでアクセストークンを取得してください："
echo "   https://app.supabase.com/account/tokens"
echo ""
echo "2. 「Generate new token」をクリックして新しいトークンを作成"
echo "   - Token name: edge-function-deploy (任意の名前)"
echo "   - 作成されたトークン（sbp_で始まる文字列）をコピー"
echo ""
echo "3. 以下のコマンドを実行してトークンを設定："
echo "   export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxx"
echo ""
echo "4. その後、このスクリプトを再実行してください"
echo ""

# トークンが設定されているか確認
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "エラー: SUPABASE_ACCESS_TOKENが設定されていません"
    exit 1
fi

echo "トークンが設定されています。デプロイを開始します..."

# プロジェクトIDを設定
PROJECT_ID="otfreskkeaenahqziriz"

# Edge Functionをデプロイ
echo "lottery関数をデプロイ中..."
npx supabase functions deploy lottery \
  --project-ref $PROJECT_ID \
  --no-verify-jwt

echo ""
echo "デプロイが完了しました！"