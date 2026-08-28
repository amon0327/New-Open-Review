# Store ID Investigation Report

## 問題の概要
`review_form_submissions`テーブルで`store_id`がnullのままになっている問題を調査し、根本原因を特定して修正を実施しました。

## 根本原因の分析

### 1. データベースの状況
- **`store_review_forms`テーブル**: 0件（空）
- **`stores`テーブル**: 0件（空）
- **`review_forms`テーブル**: 5件（データあり）
- **`review_form_submissions`テーブル**: 0件（空）

### 2. 問題の流れ
1. Lottery関数が`store_review_forms`テーブルからstore_idを取得しようとする
2. テーブルが空のため、エラー（PGRST116）が発生
3. エラーハンドリングでfallback store_id（`'00000000-0000-0000-0000-000000000001'`）を設定
4. **重要**: コードの条件分岐により、fallback値の場合はstore_idをレコードに含めない
5. 結果として、store_id列にnullが保存される

### 3. 問題のコード箇所
```typescript
// 修正前（問題のあるコード）
if (storeId !== '00000000-0000-0000-0000-000000000001') {
  submissionRecord.store_id = storeId;
}
// fallback値の場合、store_idがsubmissionRecordに含まれない = NULL
```

## 実施した修正

### 修正内容
1. **`supabase/functions/lottery/index.ts`**: 8箇所修正
2. **`src/lib/supabase.js`**: 6箇所修正

### 修正前後の比較
```typescript
// 修正前
if (storeId !== '00000000-0000-0000-0000-000000000001') {
  submissionRecord.store_id = storeId;
}

// 修正後
submissionRecord.store_id = storeId;
```

### 修正対象テーブル
- `review_form_submissions`
- `review_question_answers`
- `question_answer_texts`
- `question_answer_option_choices`
- `question_answer_option_linear_scale`

## 修正の効果

### Before
- store_idがNULL
- データの整合性に問題
- 集計・分析時にstore_idでフィルターできない

### After
- store_idに必ずfallback値（`'00000000-0000-0000-0000-000000000001'`）が設定
- データの整合性が保たれる
- fallback値でも追跡・集計が可能

## 今後の推奨対応

### 短期的な対応（完了）
- ✅ fallback store_idも保存するようにコード修正
- ✅ Edge Functionのデプロイ完了

### 中期的な対応（推奨）
1. **store_review_formsテーブルの整備**
   - 既存のreview_formsに対して適切なstore関連付けを作成
   - 実際の店舗データがある場合は、storesテーブルにデータ投入

2. **データの整合性チェック**
   - fallback store_idを使用しているレコードの特定
   - 必要に応じて実際のstore_idへの更新

### 長期的な対応（推奨）
1. **マスターデータ管理の改善**
   - store_review_formsテーブルの運用ルール策定
   - 新規フォーム作成時の店舗関連付けプロセス整備

2. **エラーハンドリングの改善**
   - fallback値の使用をログで監視
   - アラート機能の実装

## 検証方法

### 修正の確認
1. 新しい回答送信を実行
2. `review_form_submissions`テーブルでstore_idがnullでないことを確認
3. fallback値（`'00000000-0000-0000-0000-000000000001'`）が設定されていることを確認

### 監視項目
- store_idがnullの新規レコードが発生しないか
- fallback store_idの使用頻度
- 実際のstore関連付けの整備状況

## まとめ

**問題**: store_review_formsテーブルが空のため、fallback store_idが設定されてもコードの条件分岐により保存されず、結果的にstore_idがnullになっていた。

**解決**: fallback値も含めて必ずstore_idを保存するようにコードを修正し、Edge Functionをデプロイ完了。

**効果**: 今後の回答送信では、store_idがnullになることはなく、最低でもfallback値が設定される。

---

作成日: 2025年10月22日  
作成者: Claude Code  
ステータス: 修正完了・デプロイ済み