# LINE エンドポイントURL修正ガイド

## 確認されたホスティングURL
`https://reviewform-openreview.web.app`

## 修正手順

### 1. LINE Developers Consoleでの設定変更

以下のURLにアクセスして各環境の設定を修正：

#### 開発環境
1. [LINE Developers Console](https://developers.line.biz/)にログイン
2. チャネルID: `2008812853`（開発用）を選択
3. 「LIFF」タブを開く
4. LIFF ID `2008812853-cYd3wiPJ`の設定を編集
5. **エンドポイントURL**を以下に変更：
   - 現在: `https://reviewform.openreview.jp/`
   - 変更後: `https://reviewform-openreview.web.app`
6. 保存

#### 審査環境
1. チャネルID: `2008812854`（審査用）を選択
2. 同様にエンドポイントURLを変更：
   - 現在: `https://reviewform.openreview.jp/`
   - 変更後: `https://reviewform-openreview.web.app`

#### 本番環境
1. チャネルID: `2008812855`（本番用）を選択
2. エンドポイントURLの選択：
   - オプション1: `https://reviewform-openreview.web.app`（すぐに使える）
   - オプション2: `https://reviewform.openreview.jp`（カスタムドメイン設定が必要）

### 2. カスタムドメインを使用する場合（オプション）

`reviewform.openreview.jp`を使用したい場合：

1. **Firebaseコンソール**でカスタムドメインを追加：
   ```bash
   firebase hosting:sites:open
   ```
   - 「カスタムドメイン」タブで`reviewform.openreview.jp`を追加

2. **DNS設定**（ドメインプロバイダー側）：
   ```
   Type: A
   Host: reviewform
   Value: FirebaseがDNS設定時に提供するIPアドレス
   ```

3. **SSL証明書**の発行を待つ（通常1-2時間）

### 3. 設定変更後のテスト

1. **LINEアプリでテスト**（重要：ブラウザではなくLINEアプリで開く）
   ```
   開発環境テスト:
   https://miniapp.line.me/2008812853-cYd3wiPJ?storeCode=1fc07097
   ```

2. **ブラウザコンソールで確認**
   - LINEアプリ内でミニアプリを開く
   - 開発者ツールが使える場合は以下を確認：
   ```javascript
   // コンソールで実行
   liff.isLoggedIn()  // true になるはず
   liff.getAccessToken()  // トークンが返されるはず
   ```

3. **データベース確認**
   ```sql
   -- Supabaseダッシュボードで確認
   SELECT * FROM users WHERE email LIKE '%@line.local' ORDER BY created_at DESC LIMIT 10;
   ```

### 4. 成功時のログ

正しく設定された場合、コンソールに以下が表示されます：
```
LIFF initialized successfully
LINE mini app detected
isLoggedIn: true
Has access token: true
Getting LINE profile...
LINE profile obtained: {userId: "U...", displayName: "..."}
Calling registerLineUser...
Register result: success
User registered: U...@line.local
```

### 5. トラブルシューティング

もし依然として`isLoggedIn: false`の場合：

1. **キャッシュクリア**: LINEアプリのキャッシュをクリア
2. **LIFF設定の確認**: 
   - Scope: `profile`が有効か
   - Module mode: OFFになっているか
3. **URL完全一致**: HTTPSプロトコル、末尾スラッシュなし

## 重要な注意点

- **即座に反映されない場合がある**: LINE側のキャッシュにより、変更が反映されるまで数分かかることがある
- **テストは必ずLINEアプリ内で**: ブラウザでは正しく動作しない
- **開発環境から順番に**: まず開発環境で動作確認してから、審査・本番環境を変更する