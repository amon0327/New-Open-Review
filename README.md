# OpenReview（ファンループ）統合リポジトリ

飲食店向け顧客アンケート収集・分析 + LINE マーケティング支援サービス「ファンループ」（開発元名: OpenReview）の全アプリケーションコードを、単一の Git リポジトリで管理するために統合したものです。

**このリポジトリは既存 3 リポジトリのコードを一切変更せず、ディレクトリ構成を再編しただけのものです。**
見た目・機能・ビルド方法・デプロイ方法に変更はありません。各アプリは統合前と全く同じように、それぞれ単独でビルド・デプロイできます。

## 構成

```
.
├── apps/
│   ├── openreview-app/          旧 OpenReviewApp リポジトリ（そのまま移設）
│   ├── answer-app/              旧 AnswerApp リポジトリ（そのまま移設）
│   └── store-management-app/    旧 StoreManagementApp リポジトリ（そのまま移設）
├── docs/
│   └── 03_引き継ぎ書類_OpenReviewプロジェクト全体概要.pdf   事業・システム全体像の引き継ぎ資料
├── MIGRATION_NOTES.md           統合作業の詳細・注意点
└── README.md                    このファイル
```

## 各アプリの役割（引き継ぎ資料より）

| ディレクトリ | 旧リポジトリ名 | 役割 | 利用者 | プラットフォーム | 本番ドメイン |
|---|---|---|---|---|---|
| `apps/openreview-app` | OpenReviewApp | パートナー管理アプリ | パートナー・企業管理者 | PCブラウザ | app.openreview.jp |
| `apps/answer-app` | AnswerApp | お客様回答アプリ | エンドユーザー（飲食店の顧客） | スマホ（LINEミニアプリ/Web） | reviewform.openreview.jp |
| `apps/store-management-app` | StoreManagementApp | 店舗回答確認アプリ | 店舗スタッフ | スマホ | store.openreview.jp |

3 アプリは共通の Supabase プロジェクト（project ID: `otfreskkeaenahqziriz`）をデータ層として利用しますが、
Firebase Hosting は 3 つとも別プロジェクト（`openreviewapp` / `reviewform-openreview` / `store-management-app-f15ff`）にデプロイされているため、
デプロイ設定（`.firebaserc` / `firebase.json`）は各アプリディレクトリ内にそのまま残しています。

## 各アプリの起動方法

統合前と同じです。該当ディレクトリに移動して、それぞれの `package.json` の指示に従ってください。

```bash
# 例: パートナー管理アプリ（openreview-app/App が実体）
cd apps/openreview-app/App
npm install
npm start

# お客様回答アプリ
cd apps/answer-app
npm install
npm start

# 店舗回答確認アプリ
cd apps/store-management-app
npm install
npm run dev
```

## 統合作業の詳細

各アプリの内部構成に手を加えた点、確認が必要な点は `MIGRATION_NOTES.md` にまとめています。作業前に一度目を通してください。
