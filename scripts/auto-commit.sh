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

# 主要な変更ファイルを特定
main_changes=""
if git diff --cached --name-only | grep -q "src/components/"; then
    main_changes="${main_changes}UIコンポーネント、"
fi
if git diff --cached --name-only | grep -q "src/App.js"; then
    main_changes="${main_changes}アプリ設定、"
fi
if git diff --cached --name-only | grep -q "package.json"; then
    main_changes="${main_changes}依存関係、"
fi
if git diff --cached --name-only | grep -q "README.md"; then
    main_changes="${main_changes}ドキュメント、"
fi
if git diff --cached --name-only | grep -q ".js$\|.jsx$\|.ts$\|.tsx$"; then
    main_changes="${main_changes}ソースコード、"
fi

# 末尾のカンマを削除
main_changes=$(echo "$main_changes" | sed 's/、$//')

# コミットメッセージを作成
commit_message="$(cat <<EOF
${commit_type}: ${main_changes}を${commit_type}

📅 実行日時: ${timestamp}
📁 対象: ${file_summary}

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