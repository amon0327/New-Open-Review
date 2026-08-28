# Claude Code 作業ガイド

このファイルは、Claude Codeがこのプロジェクトで作業する際の重要な指示書です。

## 🤖 自動コミットシステム

### 必須実行ルール
**ファイルの作成・編集・削除を行った後は、必ず以下のコマンドを実行してください：**

```bash
./scripts/auto-commit.sh
```

### 実行タイミング
- ✅ ファイルを新規作成した後
- ✅ 既存ファイルを編集した後  
- ✅ ファイルを削除した後
- ✅ 複数ファイルを変更した作業の完了後
- ✅ 機能追加や修正が完了した後

### 自動生成されるコミットメッセージ例
```
更新: UIコンポーネント、ソースコードを更新

📅 実行日時: 2025年01月27日 14:30:45
📁 対象: 3個のファイル更新

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 📋 作業フローの例

### ファイル編集時
```bash
# 1. ファイルを編集
# 2. 編集完了後、自動コミット実行
./scripts/auto-commit.sh
```

### 複数ファイル作業時
```bash
# 1. 複数ファイルを作成・編集
# 2. 全作業完了後、まとめて自動コミット
./scripts/auto-commit.sh
```

## 🔧 プロジェクト情報

### 技術スタック
- **フロントエンド**: React 18 + Material-UI + Framer Motion
- **言語**: JavaScript (将来的にTypeScriptへ移行予定)
- **スタイリング**: Emotion (CSS-in-JS)
- **状態管理**: React Hooks (将来的にRedux Toolkit検討)

### ディレクトリ構造
```
src/
├── components/          # UIコンポーネント
│   ├── LoginPage.js    # ログイン・登録画面
│   ├── Dashboard.js    # ダッシュボード
│   └── CreatePage.js   # フォーム作成画面
├── App.js              # メインアプリケーション
├── index.js            # エントリーポイント
└── index.css           # グローバルスタイル
```

### 開発コマンド
```bash
# 開発サーバー起動
npm start

# ビルド
npm run build

# テスト実行
npm test
```

## 🎯 開発方針

### UIデザイン
- **モダンなデザイン**: Material Design準拠
- **アニメーション**: Framer Motionで滑らかな動作
- **レスポンシブ**: PC画面メイン、タブレット対応
- **カラーテーマ**: プライマリー #5e17eb、セカンダリー #667eea

### コーディング規約
- **関数コンポーネント**: Hooksを活用
- **ファイル命名**: PascalCaseでコンポーネント名と一致
- **インポート順序**: React → ライブラリ → 内部コンポーネント
- **コメント**: 日本語で記述（JSDocは英語も可）

### データベース設計
- **バックエンド**: Supabase使用
- **認証**: Supabase Auth (Email, Google, Apple)
- **スキーマ**: `database_schema.json`に定義済み

## ⚠️ 重要な注意事項

1. **自動コミット必須**: 作業後は必ず `./scripts/auto-commit.sh` を実行
2. **コンポーネント分離**: 機能ごとに適切にコンポーネントを分割
3. **型安全性**: 将来的なTypeScript移行を考慮した実装
4. **パフォーマンス**: React.memo, useCallback, useMemoを適切に使用
5. **アクセシビリティ**: Material-UIのa11y機能を活用

## 📊 変更ログ記録システム

### 必須：コード変更時のSupabaseログ記録

**対象プロジェクト**: `OpenReviewApp/App` のみ

⚠️ **重要**: このログ記録は `OpenReviewApp/App` プロジェクト内のコード変更時のみ実行すること。他のプロジェクトでは実行しない。

コードを変更したら、**必ず**以下のSupabaseテーブルに記録すること。

### 接続情報

- **URL**: `https://otfreskkeaenahqziriz.supabase.co`
- **API Key**: `App/.env` の `SUPABASE_SERVICE_ROLE_KEY` を参照すること（リポジトリには絶対に書かない）

### 記録フォーマット

`.env` から service_role キーを読み出して使う前提です。シェルから実行する場合の例:

```bash
export SUPABASE_URL="https://otfreskkeaenahqziriz.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="$(grep '^SUPABASE_SERVICE_ROLE_KEY=' App/.env | cut -d= -f2-)"

curl -X POST "${SUPABASE_URL}/rest/v1/change_logs" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "changes": "変更内容の説明",
    "additions": 追加行数,
    "deletions": 削除行数,
    "target": "対象タグ",
    "action_type": "作業種類タグ",
    "change_size": "規模タグ"
  }'
```

### タグ一覧

#### target（対象）
| タグ | 説明 |
|------|------|
| `ui` | 見た目・レイアウト |
| `ux` | インタラクション・操作性 |
| `logic` | ビジネスロジック・計算処理 |
| `data` | DB・API・外部サービス連携 |
| `auth` | 認証・認可 |
| `state` | 状態管理 |
| `routing` | 画面遷移 |
| `config` | 設定・環境 |

#### action_type（作業種類）
| タグ | 説明 |
|------|------|
| `impl` | 新規実装・機能追加 |
| `fix` | バグ修正 |
| `refactor` | リファクタリング |
| `test` | テスト追加・修正 |
| `docs` | ドキュメント |

#### change_size（規模）
| タグ | 説明 |
|------|------|
| `major` | 破壊的変更、大規模改修 |
| `minor` | 後方互換性のある機能追加 |
| `patch` | 小さな修正・調整 |

### 記録ルール

1. **タイミング**: コード変更完了直後に記録
2. **行数カウント**: `git diff --stat` または変更ファイルから算出
3. **changes**: 簡潔かつ具体的に（例：「ログインフォームのバリデーション追加」）
4. **複数タグ該当時**: 最も主要なものを1つ選択

### 記録例

```json
{
  "changes": "ユーザー登録フォームにメールバリデーション追加",
  "additions": 45,
  "deletions": 12,
  "target": "logic",
  "action_type": "impl",
  "change_size": "minor"
}
```

---

## 🚀 今後の実装予定

### Phase 1: 基本機能
- [ ] フォーム作成UI実装
- [ ] Supabase連携
- [ ] 認証機能実装
- [ ] ダッシュボード機能強化

### Phase 2: 高度な機能
- [ ] リアルタイムプレビュー
- [ ] ドラッグ&ドロップ機能
- [ ] 分析・レポート機能
- [ ] TypeScript移行

### Phase 3: 運用・最適化
- [ ] テスト充実
- [ ] パフォーマンス最適化
- [ ] SEO対応
- [ ] PWA対応

---

**このファイルは Claude Code の作業効率化とプロジェクト品質維持のために重要です。**
**必ず最新の状態に保ち、新しいClaudeセッションでも参照してください。**