# Supabase Edge Function デプロイ手順

## 1. アクセストークンの取得

1. Supabase Dashboardにアクセス: https://app.supabase.com/account/tokens
2. 「Generate new token」をクリック
3. Token nameを入力（例: `edge-function-deploy`）
4. 生成されたトークン（`sbp_`で始まる文字列）をコピー

## 2. トークンの設定

ターミナルで以下を実行：

```bash
export SUPABASE_ACCESS_TOKEN=sbp_ここにコピーしたトークンを貼り付け
```

## 3. デプロイ実行

```bash
# lottery関数をデプロイ
npx supabase functions deploy lottery \
  --project-ref otfreskkeaenahqziriz \
  --no-verify-jwt
```

## 4. その他のEdge Functions（必要に応じて）

```bash
# line-register関数をデプロイ
npx supabase functions deploy line-register \
  --project-ref otfreskkeaenahqziriz \
  --no-verify-jwt

# test-line関数をデプロイ
npx supabase functions deploy test-line \
  --project-ref otfreskkeaenahqziriz \
  --no-verify-jwt

# store-redirect関数をデプロイ
npx supabase functions deploy store-redirect \
  --project-ref otfreskkeaenahqziriz \
  --no-verify-jwt
```

## トークンを永続化する場合

毎回exportしなくて済むように、`.bashrc`や`.zshrc`に追加：

```bash
echo 'export SUPABASE_ACCESS_TOKEN=sbp_your_token_here' >> ~/.zshrc
source ~/.zshrc
```

⚠️ **注意**: トークンはGitにコミットしないよう注意してください。