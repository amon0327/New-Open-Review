# JWT Hook問題の解決方針

## 🚨 現状の問題
- JWT Custom Access Token Hookがスキーマエラーを引き起こしている
- カスタムクレームを設定するとログインが失敗する
- カスタムしなければログインは成功する

## 🔧 解決方針

### 手順1: JWT Hookを完全に無効化
1. **Supabase Dashboard** → **Authentication** → **Hooks**
2. **既存のCustom Access Token Hookを削除**
3. この状態でログインが正常に動作することを確認

### 手順2: RLSポリシーを無効化または修正
JWT Hookなしでも動作するようにRLSポリシーを調整

### 手順3: アプリケーション側で店舗情報を取得
JWTに依存せず、認証後にAPIで店舗情報を取得する方式に変更

## 🎯 最優先対応

**1. JWT Hookを削除**
- Supabaseダッシュボードで既存のHookを削除
- ログイン動作を正常化

**2. RLS無効化**
```sql
-- stores テーブルのRLSを無効化
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;
```

**3. アプリ動作確認**
- ログインが正常に動作することを確認
- 店舗情報がAuthContextから取得できることを確認

## 💡 今後の対応

JWT Hookの代わりに以下のアプローチを採用：
1. 認証後にSupabaseの通常のクエリで店舗情報を取得
2. AuthContextで店舗情報を管理
3. 必要に応じてRLSポリシーをユーザーIDベースに変更

## ⚡ 緊急対応手順

1. **今すぐ実行**: JWT Hook削除
2. **今すぐ実行**: RLS無効化  
3. **確認**: ログイン動作テスト
4. **後で対応**: 長期的なセキュリティ設計