# Edge Function デバッグガイド

## 問題の調査

ユーザーがEdge Functionのログがsupabaseに残っていないため、そもそも実行されていないのではないかと指摘しています。

## 調査結果

### フロントエンドのコード確認

1. **Dashboard.js**: 
   - 「Create」ボタン (Add アイコン) が `handleNavClick(index, onCreateForm)` を呼び出し
   - `onCreateForm` は `FormCreator` コンポーネントから渡される

2. **FormCreator.js**:
   - `handleCreateForm` 関数が `FormDataService.createNewForm(user.id)` を呼び出し

3. **FormDataService.js**:
   - `createNewForm` メソッドが `supabase.functions.invoke('create-review-form')` でEdge Functionを呼び出し

### Edge Function確認

4. **create-review-form Edge Function**:
   - `/Users/omohi.yuuto/Documents/OpenReview/OpenReviewApp/App/supabase/functions/create-review-form/index.ts`
   - 正しく実装されており、ログ出力も追加済み
   - デプロイ済み（最新版）

## デバッグ手順

### 1. ブラウザでのリアルタイム確認

1. アプリケーションをブラウザで開く
2. 開発者ツール (F12) → Console タブを開く
3. ダッシュボードで「Create」ボタンをクリック
4. コンソールログを確認：

**期待されるログ出力順序：**
```
🎯 FormCreator.handleCreateForm called with user: [ユーザーオブジェクト]
⏳ Setting isCreatingForm to true
🔄 Calling FormDataService.createNewForm with user.id: [ユーザーID]
🚀 FormDataService.createNewForm started with userId: [ユーザーID]
✅ Session obtained successfully
🔄 Calling Edge Function: create-review-form
📊 Edge Function response: [レスポンスデータ]
```

### 2. Network タブでのリクエスト確認

1. 開発者ツール → Network タブを開く
2. 「Create」ボタンをクリック
3. `create-review-form` へのリクエストを確認：
   - URL: `https://otfreskkeaenahqziriz.supabase.co/functions/v1/create-review-form`
   - Method: POST
   - Status: 200 (成功) or エラーステータス

### 3. Supabase Dashboard でのログ確認

1. https://supabase.com/dashboard/project/otfreskkeaenahqziriz/functions にアクセス
2. `create-review-form` をクリック
3. Logs タブを確認
4. リアルタイムでログが表示されるか確認

**期待されるEdge Functionログ：**
```
🚀 Edge Function create-review-form called: POST [URL]
🔑 Authorization token present: true
👤 User authentication result: { user: [ユーザーID], error: undefined }
📝 Request body title: 新規レビューフォーム
🏢 Checking company membership for user: [ユーザーID]
📊 Company membership result: [結果]
🏢 Company ID: [会社ID]
📝 Creating review form with title: 新規レビューフォーム
📋 Review form creation result: [結果]
✅ Review form created: [フォームデータ]
🔗 Creating company review form association
📊 Company review form association result: [結果]
🎉 Edge Function completed successfully
```

## 問題特定のポイント

### ケース1: フロントエンドでEdge Function呼び出しが行われていない
- コンソールに「🔄 Calling Edge Function: create-review-form」が表示されない
- Network タブに create-review-form へのリクエストが表示されない
- **原因**: フロントエンドコードの問題

### ケース2: Edge Function呼び出しは行われているが、Function内でエラー
- コンソールに「📊 Edge Function response:」でエラーが表示される
- Network タブでリクエストはあるが、エラーステータス
- **原因**: Edge Function内の認証や処理エラー

### ケース3: Edge Functionは成功しているが、後続処理でエラー
- Edge Functionのログは正常
- フロントエンドで「✅ Edge Function succeeded:」の後にエラー
- **原因**: フロントエンドの後続処理（review_form_pages等の作成）エラー

## トラブルシューティング

### エラーパターン別対処法

1. **認証エラー**
   - ユーザーがログインしているか確認
   - セッションが有効か確認

2. **会社情報なしエラー**
   - ユーザーが company_memberships に登録されているか確認
   - CompanySetup が完了しているか確認

3. **RLS (Row Level Security) エラー**
   - テーブルのRLSポリシーが正しく設定されているか確認
   - サービスロールキーが正しく設定されているか確認

## 現在の状況

- ✅ フロントエンドコードは正しくEdge Function呼び出しを実装
- ✅ Edge Functionは正しく実装されている
- ✅ ログ出力が追加済み
- ✅ Edge Functionがデプロイ済み

**次のステップ**: 実際にブラウザで新規作成ボタンをクリックして、上記のデバッグ手順を実行し、どこで問題が発生しているかを特定する。