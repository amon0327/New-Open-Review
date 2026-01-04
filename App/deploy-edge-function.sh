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

# Edge Functionをデプロイ
echo "📦 update-form-publication functionをデプロイ中..."
supabase functions deploy update-form-publication

if [ $? -eq 0 ]; then
    echo "✅ Edge Functionのデプロイが完了しました！"
else
    echo "❌ Edge Functionのデプロイに失敗しました"
    exit 1
fi