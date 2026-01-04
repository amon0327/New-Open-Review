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

# プロジェクトIDとトークンを設定
PROJECT_ID="otfreskkeaenahqziriz"
ACCESS_TOKEN="sbp_edb5d75afee774d83a466576d8cf7f7617337cab"

# Edge Functionをデプロイ（--use-apiフラグを使用）
echo "📦 update-form-publication functionをデプロイ中..."
supabase functions deploy update-form-publication \
  --project-ref $PROJECT_ID \
  --token $ACCESS_TOKEN \
  --use-api

if [ $? -eq 0 ]; then
    echo "✅ Edge Functionのデプロイが完了しました！"
else
    echo "❌ Edge Functionのデプロイに失敗しました"
    exit 1
fi