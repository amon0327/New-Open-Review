#!/bin/bash

# Edge Functionのデプロイスクリプト

echo "🚀 Edge Functionのデプロイを開始します..."

# Supabase CLIが存在するか確認
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLIがインストールされていません"
    echo "以下のコマンドでインストールしてください："
    echo "brew install supabase/tap/supabase"
    exit 1
fi

# プロジェクトディレクトリに移動
cd "$(dirname "$0")"

# プロジェクトIDを設定
PROJECT_ID="otfreskkeaenahqziriz"

# SUPABASE_ACCESS_TOKEN must be set in the environment before running this script.
# (Old hardcoded token removed after it was found committed in plaintext — that token has been revoked.)
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN is not set. Run: export SUPABASE_ACCESS_TOKEN=your_token" >&2
  exit 1
fi

# Edge Functionsをデプロイ（--use-apiフラグを使用）
echo "📦 1. update-form-publication functionをデプロイ中..."
supabase functions deploy update-form-publication \
  --project-ref $PROJECT_ID \
  --use-api

if [ $? -eq 0 ]; then
    echo "✅ update-form-publication のデプロイが完了しました！"
else
    echo "❌ update-form-publication のデプロイに失敗しました"
    exit 1
fi

echo ""
echo "📦 2. update-lottery-settings functionをデプロイ中..."
supabase functions deploy update-lottery-settings \
  --project-ref $PROJECT_ID \
  --use-api

if [ $? -eq 0 ]; then
    echo "✅ update-lottery-settings のデプロイが完了しました！"
    echo ""
    echo "🎉 すべてのEdge Functionsのデプロイが完了しました！"
else
    echo "❌ update-lottery-settings のデプロイに失敗しました"
    exit 1
fi