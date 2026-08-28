#!/bin/bash
# ========================================
# AI レポートパイプライン デプロイスクリプト
# ----------------------------------------
# Phase 2 (3段階Agent + 埋め込み + 履歴注入) の本番反映。
# 以下を順に実行:
#   1. DB マイグレーション適用 (pgvector + comment_embeddings + 新カラム)
#   2. Edge Functions デプロイ
#   3. シークレット (VOYAGE_API_KEY) 確認
#   4. 既存コメントの初回バックフィル
#
# 必要なシークレット (Supabase Edge Functions secrets):
#   ANTHROPIC_API_KEY (既存)
#   VOYAGE_API_KEY    (Phase 2 で新規 — Voyage AI のキー)
# ========================================
set -e

cd "$(dirname "$0")"
PROJECT_ID="otfreskkeaenahqziriz"
# SUPABASE_ACCESS_TOKEN must be set in the environment before running this script.
# (Old hardcoded fallback token removed after it was found committed in plaintext — that token has been revoked.)
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN is not set. Run: export SUPABASE_ACCESS_TOKEN=your_token" >&2
  exit 1
fi
export SUPABASE_ACCESS_TOKEN

echo "🚀 AI レポートパイプライン Phase 2 デプロイ開始"
echo ""

# ----------------------------------------
# 0. supabase CLI チェック
# ----------------------------------------
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI 未インストール。brew install supabase/tap/supabase"
  exit 1
fi

# ----------------------------------------
# 1. DB マイグレーション
# ----------------------------------------
echo "📦 1/4 DB マイグレーション適用 (db push)..."
echo "    - 20260501000000_create_comment_embeddings.sql"
echo "    - 20260501010000_add_embed_comments_cron.sql"
echo "    - 20260501020000_add_insight_metadata_columns.sql"
echo ""
read -p "🟡 db push を実行します。続行? [y/N] " yn
if [[ "$yn" =~ ^[Yy]$ ]]; then
  supabase db push --project-ref $PROJECT_ID
  echo "✅ マイグレーション完了"
else
  echo "⏭️  マイグレーションをスキップ (既に適用済みの場合は OK)"
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

echo "📦 2/4 Edge Functions デプロイ"
deploy_fn embed-comments
deploy_fn generate-analytics-ai-text
deploy_fn generate-analytics-insights

# ----------------------------------------
# 3. シークレット確認
# ----------------------------------------
echo "🔑 3/4 シークレット確認"
echo ""
echo "   下記が設定されているか確認してください:"
echo "     - ANTHROPIC_API_KEY"
echo "     - VOYAGE_API_KEY"
echo ""
echo "   未設定の場合:"
echo "     supabase secrets set VOYAGE_API_KEY=pa-... --project-ref $PROJECT_ID"
echo ""
read -p "🟡 シークレットは設定済みですか? [y/N] " sn
if [[ ! "$sn" =~ ^[Yy]$ ]]; then
  echo "⏭️  シークレット設定後に再度バックフィルを実行してください"
  echo ""
  echo "🎉 マイグレーション + デプロイは完了"
  exit 0
fi

# ----------------------------------------
# 4. 初回バックフィル (既存コメントを Voyage で埋め込み)
# ----------------------------------------
echo ""
echo "📥 4/4 既存コメント埋め込みバックフィル"
echo ""

# service_role key が必要 — 既存スクリプトと同様に環境変数 or app_settings から取得
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
if [ -z "$SERVICE_KEY" ]; then
  echo "⚠️  SUPABASE_SERVICE_ROLE_KEY が未設定。手動で以下を実行してください:"
  echo ""
  echo "  curl -X POST 'https://${PROJECT_ID}.supabase.co/functions/v1/embed-comments' \\"
  echo "    -H \"Authorization: Bearer \$SERVICE_ROLE_KEY\" \\"
  echo "    -H \"Content-Type: application/json\" \\"
  echo "    -d '{\"max_batches\": 100}'"
  echo ""
  echo "  返り値の embedded が 0 になるまで繰り返し実行 (1 回 ~64*30=1920 件)"
  exit 0
fi

batch=1
while true; do
  echo "→ バックフィル バッチ $batch ..."
  response=$(curl -sX POST "https://${PROJECT_ID}.supabase.co/functions/v1/embed-comments" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d '{"max_batches": 100}')

  echo "   レスポンス: $response"

  # embedded が 0 ならループ終了
  embedded=$(echo "$response" | grep -oE '"embedded":[0-9]+' | head -1 | grep -oE '[0-9]+$')
  if [ "$embedded" = "0" ] || [ -z "$embedded" ]; then
    echo "✅ バックフィル完了"
    break
  fi

  batch=$((batch + 1))
  if [ $batch -gt 50 ]; then
    echo "⚠️  バッチ数上限到達。残りは cron で順次処理されます"
    break
  fi
  sleep 2
done

echo ""
echo "🎉 Phase 2 デプロイ + バックフィル 完了"
