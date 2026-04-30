#!/bin/bash
# ========================================
# AI レポートパイプライン デプロイスクリプト
# ----------------------------------------
# Phase 2 の本番反映:
#   1. DB マイグレーション (monthly_analytics_issue へ AI メタカラム追加)
#   2. Edge Functions デプロイ (ai-text + insights)
#
# 必要なシークレット (Supabase Edge Functions secrets):
#   ANTHROPIC_API_KEY (既存)
# ========================================
set -e

cd "$(dirname "$0")"
PROJECT_ID="otfreskkeaenahqziriz"
export SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-sbp_edb5d75afee774d83a466576d8cf7f7617337cab}"

echo "🚀 AI レポートパイプライン デプロイ開始"
echo ""

if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI 未インストール。brew install supabase/tap/supabase"
  exit 1
fi

# ----------------------------------------
# 1. マイグレーション
# ----------------------------------------
echo "📦 1/2 DB マイグレーション (db push)"
echo "    - 20260501020000_add_insight_metadata_columns.sql"
echo ""
read -p "🟡 db push を実行します。続行? [y/N] " yn
if [[ "$yn" =~ ^[Yy]$ ]]; then
  supabase db push --project-ref $PROJECT_ID
  echo "✅ マイグレーション完了"
else
  echo "⏭️  マイグレーションをスキップ"
fi
echo ""

# ----------------------------------------
# 2. Edge Functions デプロイ
# ----------------------------------------
deploy_fn() {
  local fn=$1
  echo "📦 deploying $fn ..."
  supabase functions deploy $fn --project-ref $PROJECT_ID --use-api
  echo "✅ $fn"
  echo ""
}

echo "📦 2/2 Edge Functions デプロイ"
deploy_fn generate-analytics-ai-text
deploy_fn generate-analytics-insights

echo "🎉 デプロイ完了"
echo ""
echo "ANTHROPIC_API_KEY が未設定 / 古いキーの場合は以下で更新:"
echo "  supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref $PROJECT_ID"
