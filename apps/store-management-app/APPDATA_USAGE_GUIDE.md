# アプリデータ管理システム使用ガイド

## 概要

新しいアプリデータ管理システムは、ルートアクセス時のリセット機能付きのデータ保持システムです。

## 動作仕様

### ✅ データが保持される場合
- `/store` → `/store/detail` → `/alerts` などの画面遷移
- ページリロード（F5）
- ブラウザの戻る/進むボタン

### 🔄 データがリセットされる場合
- ルート(`/`)にアクセス
- 手動でのリセット実行

## 基本的な使い方

### 1. アプリにプロバイダーを追加

```jsx
// App.jsx
import AppDataProvider from './components/AppDataProvider'

function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <Router>
          <Routes>
            {/* ルート定義 */}
          </Routes>
        </Router>
      </AppDataProvider>
    </AuthProvider>
  )
}
```

### 2. コンポーネントでデータを使用

```jsx
// StorePage.jsx
import { useAppCalendarData } from '../hooks/useAppData'

const StorePage = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date())
  
  // データは初回のみ取得され、その後は保持される
  const { 
    calendarData, 
    getDataForDate, 
    loading, 
    error,
    hasData 
  } = useAppCalendarData(currentWeekStart)

  // 特定の日のデータを取得
  const today = new Date()
  const todayData = getDataForDate(today)
  
  return (
    <div>
      {loading && <div>データ読み込み中...</div>}
      {hasData && (
        <div>
          <div>今日のNPS: {todayData.nps}</div>
          <div>今日の提出数: {todayData.submissions}</div>
          <div>今日のコメント数: {todayData.comments}</div>
        </div>
      )}
    </div>
  )
}
```

### 3. 個別データフックの使用

```jsx
// 個別のデータフックも使用可能
const { data: npsData, getNPSForDate } = useAppNPSData(currentWeekStart)
const { data: submissionData, getSubmissionsForDate } = useAppSubmissionData(currentWeekStart)
const { data: commentData, getCommentsForDate } = useAppCommentData(currentWeekStart)
```

## 実際の動作フロー

### シナリオ1: 通常の使用
```
1. アプリ起動 (`/` にアクセス)
   → データリセット → 空の状態

2. `/store` に移動
   → 必要なデータを初回取得 → メモリに保持

3. 日付変更、週変更
   → 新しいデータを取得 → 既存データと合わせて保持

4. `/alerts` に移動
   → 既存データを活用、必要に応じて追加取得

5. ページリロード (F5)
   → データは保持されたまま
```

### シナリオ2: ルートリセット
```
1. `/store` で作業中 (データ保持済み)

2. ロゴクリックなどで `/` にアクセス
   → 全データリセット

3. 再び `/store` に移動
   → データを新規取得
```

## データの種類

### 自動取得されるデータ
- **NPSデータ**: 週間NPS値（日別）
- **提出数データ**: 週間提出数（日別）
- **コメント数データ**: 週間コメント数（日別）

### 取得タイミング
- 初回アクセス時: データを取得して保持
- 週変更時: 新しい週のデータを追加取得
- 日付変更時: 必要に応じて追加データを取得

## 開発者向け機能

### デバッグ情報表示
開発環境では画面左下にデバッグボタンが表示されます：

```
📊 AppData (3)  ← データ数を表示
```

クリックすると詳細情報が表示：
- 現在のパス
- リセット状態
- 保持データ数
- データキー一覧

### プログラムからの制御

```jsx
import { useAppDataContext } from '../components/AppDataProvider'

const MyComponent = () => {
  const { 
    stats,           // データ統計
    isDataReset,     // リセット状態
    lastResetTime,   // 最終リセット時刻
    forceRefresh     // 強制リフレッシュ
  } = useAppDataContext()

  // 手動でデータをリセット
  const handleReset = () => {
    forceRefresh()
  }

  return (
    <div>
      <p>保持データ数: {stats?.totalKeys || 0}</p>
      <button onClick={handleReset}>データをリセット</button>
    </div>
  )
}
```

### 低レベルAPI

```jsx
import { 
  getAppData, 
  setAppData, 
  hasAppData,
  removeAppData,
  resetAppData 
} from '../utils/appDataManager'

// 直接データを取得
const data = await getAppData('my-key', async () => {
  // 取得処理
  return await fetchMyData()
})

// データの存在確認
if (hasAppData('my-key')) {
  // データが既に存在
}

// データを削除
removeAppData('my-key')

// 全データをリセット
resetAppData()
```

## パフォーマンス特性

### メリット
- **ローディング時間短縮**: 一度取得したデータは即座に表示
- **API呼び出し削減**: 同じデータを何度も取得しない
- **ユーザー体験向上**: 画面切り替えが高速

### 考慮点
- **メモリ使用量**: データを保持するためメモリを使用
- **データ鮮度**: リアルタイム更新が必要な場合は手動リフレッシュ
- **ルートリセット**: `/` アクセス時は意図的にリセット

## 既存システムとの比較

| 機能 | 従来のキャッシュ | 新しいアプリデータ |
|------|------------------|-------------------|
| 保持期間 | 30分TTL | ルートアクセスまで |
| リセット条件 | 時間経過 | ルートアクセス |
| データ永続化 | セッションストレージ | メモリのみ |
| 先読み | あり | なし（必要時取得） |
| 設定 | 自動 | ルート監視 |

## トラブルシューティング

### データが古い
```jsx
// 手動でリフレッシュ
const { refetch } = useAppNPSData(weekStart)
refetch()

// または全データをリセット
const { forceRefresh } = useAppDataContext()
forceRefresh()
```

### メモリ使用量が気になる
```jsx
// 不要なデータを削除
removeAppDataByPattern('old_week_')

// 全データをリセット
resetAppData()
```

### デバッグ情報の確認
```jsx
import { getAppDataStats } from '../utils/appDataManager'

console.log('アプリデータ統計:', getAppDataStats())
```

この仕組みにより、ユーザーはアプリ内での移動中はデータが保持され、トップページに戻った時だけフレッシュなデータで開始できます。