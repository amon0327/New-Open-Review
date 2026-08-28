# Cleanliness データ問題のデバッグガイド

## 問題の概要
Cleanliness（清潔さ・衛生）を選択した場合、`preset_cleanliness_question_answer` テーブルの q1-q10 カラムが null になる問題。

## デバッグ手順

### 1. Edge Function のログを強化済み
lottery Edge Function に詳細なロギングを追加しました。以下の情報が記録されます：

```
=== MATRIX MAPPING DEBUG ===
- 生の回答データ構造
- パース前後のデータ
- 各キー（c1, c2, etc.）の正規表現テスト結果
- 最終的な q1-q10 へのマッピング結果
```

### 2. テスト手順

1. **新しい Cleanliness 回答を送信**
   - アプリで清潔さ・衛生を選択する流れを実行
   - 3ページ目の詳細評価（満足・普通・不満）を全て回答
   - 最後まで進めて送信

2. **Edge Function のログを確認**
   ```bash
   # Supabase ダッシュボードで確認
   https://supabase.com/dashboard/project/otfreskkeaenahqziriz/functions/lottery/logs
   ```

3. **ログで確認すべき項目**
   - `=== MATRIX MAPPING DEBUG ===` セクションを探す
   - `Matrix answers keys:` が `["c1", "c2", "c3", ...]` を表示しているか
   - `Testing key "c1":` などで正規表現がマッチしているか
   - `Final detailRecord q values:` で q1-q10 に値が入っているか

### 3. データベースで確認

```sql
-- 最新の Cleanliness 回答を確認
SELECT * FROM preset_cleanliness_question_answer
ORDER BY created_at DESC
LIMIT 5;

-- 他のテーブル（Service, Quality）と比較
SELECT 'quality' as type, q1, q2, q3 FROM preset_quality_question_answer
WHERE created_at > NOW() - INTERVAL '1 day'
UNION ALL
SELECT 'service' as type, q1, q2, q3 FROM preset_service_question_answer
WHERE created_at > NOW() - INTERVAL '1 day'
UNION ALL
SELECT 'cleanliness' as type, q1, q2, q3 FROM preset_cleanliness_question_answer
WHERE created_at > NOW() - INTERVAL '1 day';
```

### 4. 考えられる原因

1. **フロントエンドの問題**
   - Cleanliness の matrix items が正しく c1, c2, ... という ID を使用しているか
   - SentimentMatrixQuestion コンポーネントが正しくデータを送信しているか

2. **Edge Function の問題**
   - 正規表現 `/[qsc](\d+)/` が c1, c2 などをマッチできない何らかの理由
   - データのパース時にエラーが発生している

3. **データ形式の問題**
   - Cleanliness の場合だけ異なるデータ形式で送信されている可能性

### 5. 次のステップ

1. 新しい Cleanliness 回答を送信してログを確認
2. ログに基づいて問題を特定
3. 必要に応じて追加のデバッグコードを追加

## 技術的な詳細

### フロントエンド
- Cleanliness matrix items: `{ id: 'c1', text: '店舗外観・入口は清潔だったか' }` 形式
- 回答形式: `{"c1": "positive", "c2": "negative", ...}`

### Edge Function
- 正規表現: `/[qsc](\d+)/` で q1, s1, c1 をすべてマッチ
- マッピング: c1 → q1, c2 → q2, ... c10 → q10

### データベース
- すべてのテーブル（quality, service, cleanliness）は同じカラム名 q1-q10 を使用