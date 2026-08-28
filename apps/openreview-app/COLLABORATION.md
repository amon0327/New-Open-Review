# 共同開発ガイド

OpenReviewApp を二人で開発するための運用ドキュメント。

## 1. 初回セットアップ

### Clone

```bash
git clone https://github.com/openreview-official/OpenReviewApp.git
cd OpenReviewApp
```

### 環境変数ファイルの配置

このリポジトリには `.env` 系ファイルは含まれていません（gitignore 済み）。
オーナーから別経路（Slack / 1Password / メール添付など）で受け取った値を、
以下の 3 箇所に配置してください。

#### a. `App/.env.local` （フロントエンド用）

`App/.env.example` をコピーして編集：

```bash
cp App/.env.example App/.env.local
```

設定する変数:

| 変数 | 内容 | 取得元 |
|------|------|--------|
| `REACT_APP_SUPABASE_URL` | `https://otfreskkeaenahqziriz.supabase.co` | 固定値 |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase 匿名キー | Supabase ダッシュボード → Settings → API → `anon public` |
| `REACT_APP_API_TIMEOUT` | `30000` | 任意 |
| `REACT_APP_DEBUG_MODE` | `false` | 任意 |

#### b. `.env` （ルート、API サーバー用）

```bash
cp .env.example .env
```

| 変数 | 内容 |
|------|------|
| `REACT_APP_SUPABASE_URL` | 上と同じ |
| `REACT_APP_SUPABASE_ANON_KEY` | 上と同じ |
| `ANTHROPIC_API_KEY` | Claude API キー（オーナーから受領） |

#### c. `App/supabase/.env` （Supabase Edge Functions 用）

Edge Functions をローカルで動かす場合のみ必要：

```bash
cp App/supabase/.env.example App/supabase/.env
```

| 変数 | 内容 |
|------|------|
| `SUPABASE_URL` | 上と同じ |
| `SUPABASE_ANON_KEY` | 上と同じ |
| `SUPABASE_SERVICE_ROLE_KEY` | **取り扱い注意**。Supabase ダッシュボード → Settings → API → `service_role` |
| `PROJECT_ID` | `otfreskkeaenahqziriz` |
| `SUPABASE_ACCESS_TOKEN` | Supabase Personal Access Token |

### 依存インストール & 起動

```bash
cd App
npm install
npm start    # http://localhost:3000
```

## 2. ブランチ運用ルール

少人数高速開発のため **`main` 直 push** を採用。

### 基本フロー

```bash
# 作業開始前は必ず pull
git pull origin main

# 作業 → コミット → push
git add <files>
git commit -m "..."
git push origin main
```

### コンフリクトを避けるためのルール

1. **作業開始前に必ず `git pull --rebase origin main`**
2. **長時間ローカルに溜め込まない**。完了したらこまめに push
3. **同じファイルを同時に触りそうな場合は事前に Slack 等で声掛け**
4. push 直前にもう一度 `git pull --rebase` してから push

### 大きめの作業をする場合（任意）

破壊的変更や複数ファイルにまたがる大規模リファクタなど、
レビューが欲しい場合のみ feature ブランチを切って PR を出す：

```bash
git checkout -b feature/大規模変更
# ... 作業 ...
git push -u origin feature/大規模変更
gh pr create
```

## 3. やってはいけないこと

- `.env` / `.env.local` / `App/supabase/.env` を **絶対コミットしない**（gitignore 済みだが要注意）
- Supabase の `service_role` キーを **コード/ドキュメント/コメントに直書きしない**
- `App/build/`, `node_modules/`, `.firebase/hosting.*.cache` をコミットしない（gitignore 済み）
- `git push --force` を `main` に対して使わない（履歴破壊）
- `my-mcp/` はリポ管理外。各自のローカルで保持する想定

## 4. 既存の運用との整合

- `App/scripts/auto-commit.sh` は単独利用時の自動コミット用。**共同開発では基本使わない**
  （複数人で勝手にコミットされると履歴が混乱するため、手動コミットを推奨）
- `App/CLAUDE.md` の **change_logs テーブル記録** は維持（コード変更時に Supabase へ記録）
  ただし API キーは `App/.env` から読み込む方式に変更済み

## 5. Supabase / インフラ情報

| 項目 | 値 |
|------|------|
| Supabase Project ID | `otfreskkeaenahqziriz` |
| Supabase URL | `https://otfreskkeaenahqziriz.supabase.co` |
| Firebase プロジェクト | `.firebaserc` 参照 |
| Vercel プロジェクト | `api-server/vercel.json` 参照 |

## 6. トラブルシューティング

### `git pull` でコンフリクトした

```bash
# コンフリクトしたファイルを編集して解決
git add <解決したファイル>
git rebase --continue   # rebase 中の場合
# or
git commit              # merge 中の場合
```

### `.env` の値が反映されない

- `npm start` を再起動（環境変数はビルド時に取り込まれる）
- ファイル名が `.env.local` であることを確認（`.env` ではフロントエンドからは読まれない）

### push が `HTTP 400` で失敗する

リポが大きいため：

```bash
git config --local http.postBuffer 524288000
git push origin main
```
