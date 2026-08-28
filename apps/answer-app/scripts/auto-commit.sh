#!/bin/bash

# OpenReview Answer App - 自動コミットスクリプト
# 使用方法: npm run commit "コミットメッセージ"

# 引数からコミットメッセージを取得
COMMIT_MESSAGE="$1"

# デフォルトメッセージの設定
if [ -z "$COMMIT_MESSAGE" ]; then
  COMMIT_MESSAGE="Update OpenReview Answer App"
fi

# 現在の日時を取得
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# カラー出力の設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🚀 OpenReview Answer App - 自動Git管理${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# Git設定の確認
echo -e "${BLUE}📋 Git設定を確認中...${NC}"
if ! git config user.name > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Git user.nameが設定されていません。設定中...${NC}"
  git config user.name "Claude Code"
fi

if ! git config user.email > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Git user.emailが設定されていません。設定中...${NC}"
  git config user.email "claude@anthropic.com"
fi

echo -e "${GREEN}✅ Git設定完了${NC}"
echo ""

# 現在の状態を表示
echo -e "${BLUE}📊 現在のリポジトリ状態:${NC}"
git status --short
echo ""

# ファイルを追加
echo -e "${BLUE}📁 変更ファイルを追加中...${NC}"
git add .

# 追加されたファイルを表示
echo -e "${BLUE}📝 追加されたファイル:${NC}"
git diff --cached --name-only
echo ""

# コミット実行
echo -e "${BLUE}💾 コミット実行中...${NC}"
echo -e "${CYAN}メッセージ: ${COMMIT_MESSAGE}${NC}"
echo -e "${CYAN}日時: ${TIMESTAMP}${NC}"
echo ""

FULL_COMMIT_MESSAGE="${COMMIT_MESSAGE}

🤖 Generated with Claude Code at ${TIMESTAMP}

Co-Authored-By: Claude <noreply@anthropic.com>"

if git commit -m "$FULL_COMMIT_MESSAGE"; then
  echo ""
  echo -e "${GREEN}✅ コミット成功！${NC}"
  
  # 最新のコミット情報を表示
  echo ""
  echo -e "${BLUE}📜 最新のコミット:${NC}"
  git log --oneline -1
  
  echo ""
  echo -e "${GREEN}🎉 Git管理完了！${NC}"
  echo -e "${CYAN}================================================${NC}"
else
  echo ""
  echo -e "${RED}❌ コミットに失敗しました${NC}"
  echo -e "${YELLOW}変更がない可能性があります${NC}"
  echo -e "${CYAN}================================================${NC}"
  exit 1
fi