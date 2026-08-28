# テストモード削除ガイド

このファイルは、テストモード機能を削除する際の手順書です。
テストモードが不要になった際は、以下の手順で削除してください。

## 設計について

**注意：** 現在の実装は完全ファイル分離方式を採用していますが、
UIコンポーネントやチャート処理が共通の場合は、設定ベース方式の方が
コード重複を避けられ、保守性が高くなります。

将来的な改善案：
- TestModeAnalyticsService.jsの代わりに設定ベースアプローチを検討
- 共通処理ロジックの重複を避ける設計への移行を推奨

## 削除対象ファイル・コード

### 1. 完全削除するファイル
- `src/constants/testDatabaseSchema.js` - テスト用データベーススキーマ定義
- `src/services/TestModeAnalyticsService.js` - テストモード専用サービス
- `TESTMODE_DELETION_GUIDE.md` - このファイル自体

### 2. 部分削除するファイル

#### `src/services/AnalyticsService.js`
削除対象のコードブロック：
```javascript
// ========= テストモード関連インポート（削除予定） =========
import { TestModeAnalyticsService } from './TestModeAnalyticsService';
// ========================================================

// ========= テストモード分岐（削除予定） =========
if (isTestMode) {
  return await TestModeAnalyticsService.getBasicStats();
}
// ============================================

// ========= テストモード分岐（削除予定） =========
if (isTestMode) {
  return await TestModeAnalyticsService.getTimeSeriesData(days);
}
// ============================================
```

関数シグネチャの修正：
- `getBasicStats(userId, isTestMode = false)` → `getBasicStats(userId)`
- `getTimeSeriesData(userId, days = 30, isTestMode = false)` → `getTimeSeriesData(userId, days = 30)`

#### `src/components/dashboard/pages/AnalyticsPage.js`
削除対象のコードブロック：
```javascript
// ========= テストモード関連state（削除予定） =========
const [isTestMode, setIsTestMode] = useState(false);

// テストモード切り替えハンドラー（削除予定）
const handleTestModeToggle = () => {
  setIsTestMode(!isTestMode);
  // テストモードに入る際は選択された質問をクリア
  if (!isTestMode) {
    setSelectedQuestions([]);
  }
};
// =================================================

{/* ========= テストモード切り替えUI（削除予定） ========= */}
<Box sx={{ 
  position: 'fixed',
  bottom: 30,
  // ... (全UIコンポーネント)
</Box>
{/* ================================================== */}

{/* ========= テストモードprops（削除予定） ========= */}
isTestMode={isTestMode}
{/* ============================================== */}
```

#### `src/components/analytics/QuestionSidebar.js`
削除対象のコードブロック：
```javascript
// ========= テストモードparam（削除予定） =========
isTestMode = false
// ==============================================
```

#### `src/components/analytics/ChartArea.js`
削除対象のコードブロック：
```javascript
// ========= テストモードparam（削除予定） =========
isTestMode = false
// ==============================================
```

## 削除手順

### Step 1: ファイル削除
```bash
rm src/constants/testDatabaseSchema.js
rm src/services/TestModeAnalyticsService.js
rm TESTMODE_DELETION_GUIDE.md
```

### Step 2: コード削除
上記「部分削除するファイル」の各ファイルから、削除対象のコードブロックを削除

### Step 3: 動作確認
- Analytics画面が正常に表示されることを確認
- 本番モードでのデータ取得が正常に動作することを確認
- ビルドエラーがないことを確認

### Step 4: コミット
```bash
git add -A
git commit -m "remove: テストモード機能を削除

テスト期間が終了したため、テストモード関連の
全機能とファイルを削除しました。

- TestModeAnalyticsService.jsを削除
- testDatabaseSchema.jsを削除
- AnalyticsPageのテストモードUIを削除
- 各コンポーネントのテストモードパラメータを削除"
```

## 注意事項

- 削除前に、テストモードでのテストが完了していることを確認してください
- 削除後は元に戻すことができないため、必要に応じてバックアップを取ってください
- 削除作業は段階的に行い、各段階で動作確認することを推奨します

---

**このガイドに従って削除作業を行うことで、テストモード機能を安全に削除できます。**