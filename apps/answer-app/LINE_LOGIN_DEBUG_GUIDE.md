# LINEログイン問題のデバッグガイド

## 問題の症状
- `LINE mini app detected`と表示される
- `No access token available`エラーが発生
- `liff.isLoggedIn()`が`false`を返す
- ユーザー情報がデータベースに書き込まれない

## 根本原因
**LIFF初期化は成功するが、ログイン状態にならない**

これは通常、LINE Developers ConsoleのエンドポイントURL設定が実際のアプリURLと一致していない場合に発生します。

## 解決方法

### 1. Firebase Hosting URLの確認
```bash
firebase hosting:sites:list
```
出力されるURLを確認（例: `https://reviewform-openreview.web.app`）

### 2. LINE Developers Consoleでの設定確認

各環境のLIFF設定で以下を確認：

#### 開発環境（LIFF ID: 2008812853-cYd3wiPJ）
- **エンドポイントURL**: `https://reviewform-openreview.web.app`
- **Scope**: `profile`を有効化
- **Module mode**: OFF

#### 審査環境（LIFF ID: 2008812854-Q2qSHLPI）
- **エンドポイントURL**: `https://reviewform-openreview.web.app`
- **Scope**: `profile`を有効化
- **Module mode**: OFF

#### 本番環境（LIFF ID: 2008812855-Ig8w1gkY）
- **エンドポイントURL**: `https://reviewform.openreview.jp`
- **Scope**: `profile`を有効化
- **Module mode**: OFF

### 3. カスタムドメインの設定（本番環境の場合）

もし`reviewform.openreview.jp`を使用する場合：

1. Firebaseコンソールで`reviewform.openreview.jp`をカスタムドメインとして追加
2. DNSレコードを適切に設定
3. SSL証明書の発行を待つ

### 4. デバッグ手順

1. **ブラウザコンソールで確認**
   ```javascript
   // LIFF初期化後に実行
   liff.isLoggedIn()  // trueであるべき
   liff.isInClient()  // trueであるべき
   liff.getAccessToken()  // トークンが返されるべき
   ```

2. **URLの確認**
   - 現在のURL: ブラウザのアドレスバーを確認
   - LINE Developersに登録したURL: 完全に一致している必要がある

3. **テストURL**
   ```
   開発: https://miniapp.line.me/2008812853-cYd3wiPJ?storeCode=1fc07097
   ```

### 5. よくある間違い

1. **URLの末尾のスラッシュ**
   - NG: `https://reviewform-openreview.web.app/`
   - OK: `https://reviewform-openreview.web.app`

2. **HTTPSでない**
   - 必ずHTTPSを使用する

3. **ポート番号**
   - 本番環境では`:3000`などのポート番号を含めない

### 6. 確認後の動作

設定が正しい場合：
1. LINEミニアプリを開く
2. 自動的に`liff.isLoggedIn()`が`true`になる
3. プロファイル情報が取得される
4. `line-register`エッジ関数が呼ばれる
5. ユーザー情報がデータベースに保存される

## 追加のデバッグ情報

コンソールに以下のログが表示されるはずです：
```
LIFF initialized successfully
LINE mini app detected
isLoggedIn: true
Has access token: true
LINE profile obtained: {userId: "U...", displayName: "..."}
User registered: U...@line.local
```

もし`isLoggedIn: false`の場合、エンドポイントURL設定を確認してください。