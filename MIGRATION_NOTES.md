# 統合作業メモ（2026年8月28日実施）

## やったこと

1. `OpenReviewApp` / `AnswerApp` / `StoreManagementApp` の3リポジトリを、それぞれ内容を一切変更せず
   `apps/openreview-app` / `apps/answer-app` / `apps/store-management-app` としてそのまま移設。
2. 移設後、元リポジトリとのバイナリ差分（`diff -rq`）を確認し、全ファイルが完全一致していることを確認済み。
   - ファイル数: openreview-app 368 / answer-app 127 / store-management-app 148（すべて移設前後で一致）
3. 各アプリの `.gitignore` / `.firebaserc` / `firebase.json` / `package.json` はすべて元のまま、アプリ内に残置。
   → ビルド・デプロイ手順（`npm start`, `npm run dev`, `firebase deploy` 等）は統合前と完全に同一です。
4. リポジトリ直下に `README.md`（全体像）と `docs/`（引き継ぎ資料PDF）を新規追加。

## 変更していないこと（意図的）

- 各アプリ内部のディレクトリ構成・ファイル名・コードは1文字も変更していません。
- 3アプリが個別に持つ `supabase/functions` や `.firebase` 設定などは統合・重複排除していません
  （後述の通り、判断が必要な重複があるため、コード担当者の判断なしに触るとリスクがあるためです）。
- `node_modules` はそもそも渡された3リポジトリに含まれていなかったため、統合後リポジトリにも含まれていません
  （各アプリの `.gitignore` により、今後の `git add` でも自動的に除外されます）。

## 統合作業中に気づいた点（要確認・引き継ぎ資料には記載なし）

作業対象を正しく把握するために全ファイルを確認した際、引き継ぎ資料の記載と実際のコードとの間で
以下の点が気になったので、コードは一切変更せず、事実確認のためにここに記録します。沼野さんに確認してください。

### 1. `apps/openreview-app` 内に Claude APIプロキシの実装が3つ存在する
- `apps/openreview-app/App/src/services/claudeApi.js`（フロントエンドから呼び出す側）
- `apps/openreview-app/server/`（`openreviewapp-server`、Vercel Functions、CommonJS）
- `apps/openreview-app/api-server/`（`openreview-api-server`、Vercel Functions、ESM、APIキー認証+レート制限あり）
- `apps/openreview-app/supabase-edge/`（Supabase Edge Function `claude-api`）

4箇所とも中身が異なっており（`diff`で確認済み、単純なコピーではなく実装が違う）、
どれが現在本番で使われているものか、このドキュメントだけでは判断できませんでした。
不要な実装が残っている可能性があるので、統合作業とは別に整理を検討した方が良さそうです。

### 2. Supabase Edge Functions が3系統に分散している
- `apps/openreview-app/App/supabase/functions/`（約35関数。月次レポート生成・LINE配信など、引き継ぎ資料の中核機能はここに実装されている）
- `apps/openreview-app/supabase-edge/supabase/functions/`（`claude-api` のみ、1関数）
- `apps/answer-app/supabase/functions/`（9関数。LINE認証・抽選など）
- `apps/store-management-app/supabase/functions/`（10関数。店舗側の集計・招待など）

いずれも同一の Supabase プロジェクト（project ref: `otfreskkeaenahqziriz`、引き継ぎ資料記載のプロジェクトIDと一致）に
リンクされていることを `.temp/project-ref` で確認しました。関数名の重複はありませんでしたが、
`apps/openreview-app/App/supabase/` と `apps/openreview-app/supabase-edge/supabase/` の2つの `supabase/` ディレクトリが
同じプロジェクトに向いているため、将来的に Edge Functions のデプロイ・管理を1箇所に集約することを検討してもよいかもしれません
（今回は機能変更ゼロの方針のため、統合はせず現状のまま保持しています）。

## 未対応（今回のスコープ外）

- 3アプリの依存パッケージ（`package.json`）の共通化・monorepoツール（npm/yarn workspaces等）導入は行っていません。
  各アプリが個別の Firebase プロジェクトにデプロイされているため、ビルド・デプロイの独立性を優先しました。
- Git のコミット履歴（各アプリの旧リポジトリの履歴）は引き継いでいません。今回渡されたのはコードのスナップショット（zip）のみのため、
  このリポジトリは新規の初回コミットとして作成しています。旧リポジトリの履歴も残したい場合は `git subtree` 等での取り込みが可能ですが、
  そのためには旧リポジトリの `.git` 履歴データが別途必要です。
