# LIFFデバッグ手順

## スマートフォンでのデバッグ方法

### 1. デバッグ情報の確認

アプリを開くと、画面上部に緑色の枠で囲まれたデバッグパネルが表示されます。

**表示される情報：**
- URL: 現在のアクセスURL
- UA: ユーザーエージェント（デバイス情報）
- 各種LIFF初期化ログ（時系列）

**色分け：**
- 🔴 赤色: エラー、失敗、false
- 🟢 緑色: 成功、true、completed
- 🟡 黄色: 警告、waiting
- 🔵 青色: 一般情報

### 2. 重要な確認ポイント

以下の情報を特に確認してください：

```
LIFF initialized: true/false  → LIFFが初期化されたか
Is in client: true/false      → LINEアプリ内かどうか
Is logged in: true/false      → ログイン状態（これがfalseだと問題）
Access token: exists/null     → アクセストークンの有無
```

### 3. デバッグ情報の送信

デバッグ情報が5行以上表示されたら、「Send Debug to Server」ボタンが表示されます。
このボタンをタップすると、デバッグ情報がサーバーに送信され、分析結果が返されます。

### 4. PCでのテスト方法（開発用）

PCブラウザでもLIFFをテストできます：

1. Chrome DevToolsを開く（F12）
2. デバイスモードをモバイルに切り替え（Ctrl+Shift+M）
3. User Agentを変更：
   - DevTools > Network conditions
   - User agent > Custom
   - `Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Line/11.15.0`

4. 以下のURLにアクセス：
   ```
   https://reviewform.openreview.jp/?reviewFormId=0605e6b1-e0fb-4fae-9db0-f31239e16f31&storeCode=1fc07097
   ```

## 問題の特定方法

### ケース1: `LIFF initialized: false`
- LIFF IDが正しくない
- 環境変数の設定ミス

### ケース2: `Is logged in: false`
- エンドポイントURLの不一致
- LINE Developers Consoleの設定問題
- Scopeの設定不足

### ケース3: `Access token: null`
- ログインしていない
- LIFF初期化が失敗している

## Supabaseでのログ確認

Edge Functionのログを確認：
```bash
supabase functions logs debug-liff --tail
```

または、新しいテーブルを作成してログを保存：

```sql
CREATE TABLE IF NOT EXISTS liff_debug_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  debug_info jsonb,
  user_agent text,
  url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

## 次のステップ

1. スマートフォンでLINEミニアプリを開く
2. デバッグパネルの情報を確認
3. 「Send Debug to Server」でログを送信
4. エラー内容に応じて対処

特に「Is logged in: false」の場合は、LINE Developers Consoleの設定を再確認してください。