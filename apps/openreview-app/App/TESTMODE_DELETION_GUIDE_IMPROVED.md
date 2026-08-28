# テストモード削除ガイド（改善版）

設定ベース方式によるテストモード削除手順

## 設計の特徴

### ✅ 改善された設計
- **共通ロジック**: データ処理、チャート生成、UIコンポーネントは完全に共通
- **設定分離**: テーブル名のみを設定で切り替え
- **削除時の影響**: 設定部分とパラメータのみを削除すればよい

## 削除手順

### Step 1: 設定ファイルの修正

#### `src/config/databaseConfig.js`
```javascript
// 削除前
export const getDatabaseConfig = (isTestMode = false) => {
  return DATABASE_CONFIG[isTestMode ? 'test' : 'production'];
};

// 削除後
export const getDatabaseConfig = () => {
  return DATABASE_CONFIG.production;
};
```

```javascript
// 削除対象: test設定全体を削除
const DATABASE_CONFIG = {
  production: { /* 残す */ },
  // test: { /* この部分を削除 */ }
};
```

### Step 2: サービスクラスの修正

#### `src/services/AnalyticsService.js`
```javascript
// 削除前
static async getBasicStats(userId, isTestMode = false) {
  const config = getDatabaseConfig(isTestMode);
  
  if (isTestMode) {
    // このif文全体を削除
  } else {
    // この部分を残す
  }
}

// 削除後
static async getBasicStats(userId) {
  const config = getDatabaseConfig();
  
  // 本番モード用クエリのみ残す
  const [formsQuery, submissionsQuery, questionsQuery] = [
    // ...
  ];
}
```

### Step 3: UIコンポーネントの修正

#### `src/components/dashboard/pages/AnalyticsPage.js`
```javascript
// 削除対象
const [isTestMode, setIsTestMode] = useState(false);
const handleTestModeToggle = () => { /* ... */ };

// テストモードUI全体を削除
<Box sx={{ /* テストモードスイッチ */ }}>
  // この部分を削除
</Box>

// propsから削除
<QuestionSidebar isTestMode={isTestMode} /> // → <QuestionSidebar />
<ChartArea isTestMode={isTestMode} />       // → <ChartArea />
```

### Step 4: 不要ファイルの削除
```bash
rm src/services/TestModeAnalyticsService.js
rm src/constants/testDatabaseSchema.js
```

## 削除後のコード例

### 削除後の設定ファイル
```javascript
// src/config/databaseConfig.js
const DATABASE_CONFIG = {
  production: {
    REVIEW_FORMS: 'review_forms',
    REVIEW_FORM_SUBMISSIONS: 'review_form_submissions',
    // ...
  }
};

export const getDatabaseConfig = () => {
  return DATABASE_CONFIG.production;
};
```

### 削除後のサービス
```javascript
// src/services/AnalyticsService.js
static async getBasicStats(userId) {
  const config = getDatabaseConfig();
  
  const [formsResult, submissionsResult, questionsResult] = await Promise.all([
    supabase.from(config.REVIEW_FORMS)/* ... */,
    supabase.from(config.REVIEW_FORM_SUBMISSIONS)/* ... */,
    supabase.from(config.REVIEW_QUESTIONS)/* ... */
  ]);
  
  // 共通のデータ処理ロジック（変更なし）
  return { /* ... */ };
}
```

## この設計の利点

### ✅ コード重複なし
- データ処理、チャート生成ロジックは1箇所のみ
- UIコンポーネントも完全に共通

### ✅ 削除が簡単
- 設定オブジェクトの一部のみ削除
- if分岐を削除して本番用ロジックを残すだけ
- パラメータを削除するだけ

### ✅ 将来の拡張に強い
- 新しいチャートタイプを追加しても重複なし
- 新しい分析機能を追加してもテストモード対応が簡単

### ✅ 安全性
- 本番ロジックに一切変更を加えない
- 削除時のリスクが最小

## 削除時の確認事項

1. **動作確認**
   - Analytics画面が正常表示されること
   - 本番データが正しく取得されること
   - チャート表示が正常であること

2. **ビルド確認**
   - コンパイルエラーがないこと
   - TypeScript型エラーがないこと（将来移行時）

3. **テスト確認**
   - 既存のテストが通ること
   - 新規テストの追加

---

この設計により、テストモード削除時は**最小限の変更**で**安全に**削除できます。