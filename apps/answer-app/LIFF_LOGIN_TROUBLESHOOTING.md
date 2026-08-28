# LIFF ログイン問題のトラブルシューティングガイド

## 現在の状況
- エンドポイントURL `https://reviewform.openreview.jp/` は正しく設定されている
- カスタムドメインは正常にFirebase Hostingに接続されている（HTTP 200応答）
- しかし、`liff.isLoggedIn()` が `false` を返す

## 追加したデバッグ機能

### 1. 詳細なデバッグ情報の出力
`src/utils/debugLiff.js` を作成し、以下の情報を収集：
- LIFF初期化状態
- 認証情報（アクセストークン、IDトークン）
- コンテキスト情報
- プロファイル情報
- エラー詳細

### 2. WelcomePageでの追加ログ
- 現在のURL
- Origin情報
- LIFF ID
- OS/言語情報

## 他の可能性のある原因

### 1. **Scope設定の問題**
LINE Developers Consoleで確認：
- `profile` スコープが有効になっているか
- `openid` スコープも必要な場合がある

### 2. **Module Modeの設定**
- Module ModeがONになっていると問題が発生する可能性
- 必ずOFFに設定する

### 3. **LIFF URLパラメータの問題**
LINEミニアプリのURLに問題がある可能性：
```
# 正しい形式
https://miniapp.line.me/2008812853-cYd3wiPJ

# パラメータ付き
https://miniapp.line.me/2008812853-cYd3wiPJ?storeCode=1fc07097
```

### 4. **LIFF SDKのバージョン互換性**
現在使用中: `@line/liff` v2.23.0
- 最新バージョンとの互換性を確認
- LINE側のAPIアップデートとの整合性

### 5. **CORS設定の問題**
Firebase Hostingのヘッダー設定を確認：
```json
// firebase.json
{
  "hosting": {
    "headers": [{
      "source": "**",
      "headers": [{
        "key": "Access-Control-Allow-Origin",
        "value": "https://miniapp.line.me"
      }]
    }]
  }
}
```

### 6. **SSL証明書の問題**
- カスタムドメインのSSL証明書が完全に有効か
- 中間証明書が正しく設定されているか

## デバッグ手順

1. **LINEアプリでアクセス**
   ```
   https://miniapp.line.me/2008812853-cYd3wiPJ
   ```

2. **コンソールログを確認**
   - `=== LIFF Debug Information ===` を探す
   - 詳細なJSON出力を確認

3. **特に注目すべき項目**
   ```javascript
   {
     "liff": {
       "isLoggedIn": false,  // これがtrueになるべき
       "id": "2008812853-cYd3wiPJ"  // LIFF IDが正しいか
     },
     "auth": {
       "hasAccessToken": false,  // トークンが取得できているか
     },
     "errors": []  // エラーメッセージを確認
   }
   ```

4. **LINE Developers Consoleで再確認**
   - Basic settings > Endpoint URL
   - LIFF > Scope設定
   - LIFF > Module mode

## 次のステップ

1. デバッグ情報から具体的なエラーを特定
2. LINE Developers Consoleの設定を再度確認
3. 必要に応じてLIFF SDKのアップデートを検討
4. Firebase Hostingの設定を調整

## 備考
- `testuser`は書き込めているため、Edge FunctionsとSupabaseの接続は正常
- 問題はLIFF認証の部分に限定されている