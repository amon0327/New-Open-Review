#!/bin/bash

# OpenReview自動コミットスクリプト
# Claude Codeが変更を加えた際に自動実行される

set -e

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# 変更があるかチェック
if git diff --quiet && git diff --cached --quiet; then
    echo "変更がありません。コミットをスキップします。"
    exit 0
fi

# 変更されたファイルを確認
echo "=== 変更されたファイル ==="
git status --porcelain

echo ""
echo "=== 変更内容の概要 ==="
git diff --stat

# 新しいファイルがある場合は追加
if [ -n "$(git ls-files --others --exclude-standard)" ]; then
    echo ""
    echo "=== 新しいファイルを追加 ==="
    git add .
fi

# 既存ファイルの変更もステージング
git add -u

# タイムスタンプを生成
timestamp=$(date '+%Y年%m月%d日 %H:%M:%S')

# 変更されたファイルの数を取得
modified_files=$(git diff --cached --name-only | wc -l | tr -d ' ')
new_files=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')

# コミットメッセージを自動生成
if [ "$modified_files" -gt 0 ] && [ "$new_files" -gt 0 ]; then
    commit_type="更新・追加"
    file_summary="${modified_files}個のファイル更新、${new_files}個のファイル追加"
elif [ "$modified_files" -gt 0 ]; then
    commit_type="更新"
    file_summary="${modified_files}個のファイル更新"
elif [ "$new_files" -gt 0 ]; then
    commit_type="追加"
    file_summary="${new_files}個のファイル追加"
else
    commit_type="変更"
    file_summary="ファイル変更"
fi

# 変更の詳細を分析してコミットタイプとメッセージを決定
commit_prefix=""
commit_description=""
changed_files=$(git diff --cached --name-only)

# 具体的な変更内容を分析
if echo "$changed_files" | grep -q "src/components/CreatePage.js"; then
    if git diff --cached src/components/CreatePage.js | grep -q "設定"; then
        commit_prefix="feat"
        commit_description="設定画面の機能改善"
    elif git diff --cached src/components/CreatePage.js | grep -q "プレビュー"; then
        commit_prefix="fix"
        commit_description="プレビュー機能の修正"
    elif git diff --cached src/components/CreatePage.js | grep -q "refactor\|分割\|リファクタリング"; then
        commit_prefix="refactor"
        commit_description="CreatePageコンポーネントのリファクタリング"
    else
        commit_prefix="update"
        commit_description="CreatePageコンポーネントの改善"
    fi
elif echo "$changed_files" | grep -q "src/components/"; then
    commit_prefix="update"
    commit_description="UIコンポーネントの改善"
elif echo "$changed_files" | grep -q "package.json"; then
    commit_prefix="deps"
    commit_description="依存関係の更新"
elif echo "$changed_files" | grep -q "README.md\|CLAUDE.md"; then
    commit_prefix="docs"
    commit_description="ドキュメントの更新"
else
    commit_prefix="update"
    commit_description="プロジェクトファイルの更新"
fi

# より詳細な変更内容を追加
details=""
if echo "$changed_files" | grep -q "constants/"; then
    details="${details}\n- 定数ファイルの整理"
fi
if git diff --cached --name-only | head -5 | while read file; do
    if [ -n "$file" ]; then
        echo "- $(basename "$file")の変更"
    fi
done | head -3 > /tmp/file_changes; then
    file_details=$(cat /tmp/file_changes)
    if [ -n "$file_details" ]; then
        details="${details}\n${file_details}"
    fi
fi

# コミットメッセージを作成
commit_message="$(cat <<EOF
${commit_prefix}: ${commit_description}

📅 実行日時: ${timestamp}
📁 対象: ${file_summary}${details}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# コミット実行
echo ""
echo "=== コミット実行 ==="
git commit -m "$commit_message"

echo ""
echo "✅ 自動コミットが完了しました"
echo "📝 コミットメッセージ:"
echo "$commit_message"

# 最新のコミット履歴を表示
echo ""
echo "=== 最新のコミット履歴 ==="
git log --oneline -5