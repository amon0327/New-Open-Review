// JWTクレームをテストするためのコード
// ブラウザのコンソールで実行可能

const testJWTClaims = async () => {
  try {
    // 現在のユーザー情報を取得
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('❌ ユーザー取得エラー:', error)
      return
    }
    
    if (!user) {
      console.log('❌ ユーザーがログインしていません')
      return
    }
    
    console.log('🔍 ユーザー基本情報:')
    console.log('  User ID:', user.id)
    console.log('  Email:', user.email)
    
    console.log('\n🔍 JWTクレーム情報:')
    const metadata = user.app_metadata || {}
    
    // 店舗関連の情報
    const storeIds = metadata.store_ids || []
    const storeRoles = metadata.store_roles || {}
    const defaultStoreId = metadata.default_store_id
    const hasStoreAccess = metadata.has_store_access || false
    const storeCount = metadata.store_count || 0
    const userType = metadata.user_type || 'unknown'
    
    console.log('  店舗IDリスト:', storeIds)
    console.log('  店舗での役割:', storeRoles)
    console.log('  デフォルト店舗ID:', defaultStoreId)
    console.log('  店舗アクセス権限:', hasStoreAccess)
    console.log('  店舗数:', storeCount)
    console.log('  ユーザータイプ:', userType)
    
    // 各店舗での役割を詳細表示
    if (storeIds.length > 0) {
      console.log('\n📋 店舗別役割詳細:')
      storeIds.forEach(storeId => {
        const role = storeRoles[storeId] || 'unknown'
        console.log(`  店舗 ${storeId}: ${role}`)
      })
    } else {
      console.log('\n📋 このユーザーは店舗に紐付いていません')
    }
    
    // 実用的な使用例
    console.log('\n💡 実用例:')
    
    // 特定の店舗へのアクセス権限チェック
    const checkStoreAccess = (targetStoreId) => {
      return storeIds.includes(targetStoreId)
    }
    
    // 特定の店舗での役割チェック
    const getStoreRole = (targetStoreId) => {
      return storeRoles[targetStoreId] || null
    }
    
    // 管理者権限チェック
    const hasManagerRole = (targetStoreId) => {
      const role = getStoreRole(targetStoreId)
      return role === 'manager' || role === 'admin'
    }
    
    console.log('  アクセス権限チェック関数:', checkStoreAccess)
    console.log('  役割取得関数:', getStoreRole)
    console.log('  管理者権限チェック関数:', hasManagerRole)
    
    return {
      storeIds,
      storeRoles,
      defaultStoreId,
      hasStoreAccess,
      storeCount,
      userType,
      checkStoreAccess,
      getStoreRole,
      hasManagerRole
    }
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error)
  }
}

// 使用方法:
// 1. ブラウザでアプリにログイン
// 2. 開発者ツールのコンソールで以下を実行:
// testJWTClaims()

// セッション更新後に再テスト
const retestAfterRefresh = async () => {
  console.log('🔄 セッションを更新してから再テスト...')
  await supabase.auth.refreshSession()
  setTimeout(() => {
    testJWTClaims()
  }, 1000)
}

console.log('🚀 JWTテスト関数が読み込まれました')
console.log('使用方法:')
console.log('  testJWTClaims() - JWTクレームをテスト')
console.log('  retestAfterRefresh() - セッション更新後に再テスト')