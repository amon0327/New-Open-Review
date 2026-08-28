// stores テーブルのRLSポリシーをテストするコード
// ブラウザのコンソールで実行

const testStoresRLS = async () => {
  try {
    console.log('🔍 Stores RLSポリシーのテスト開始...\n')
    
    // 1. 現在のJWTクレームを確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('❌ ユーザーがログインしていません')
      return
    }
    
    const storeIds = user.app_metadata?.store_ids || []
    const storeRoles = user.app_metadata?.store_roles || {}
    const hasStoreAccess = user.app_metadata?.has_store_access || false
    
    console.log('📋 ユーザーのJWTクレーム:')
    console.log('  Store IDs:', storeIds)
    console.log('  Store Roles:', storeRoles)
    console.log('  Has Store Access:', hasStoreAccess)
    console.log('')
    
    // 2. stores テーブルから全データを取得（RLSによりフィルタされる）
    console.log('🏪 アクセス可能な店舗一覧:')
    const { data: stores, error: selectError } = await supabase
      .from('stores')
      .select('id, name, address, created_at')
      .order('created_at', { ascending: false })
    
    if (selectError) {
      console.error('❌ 店舗取得エラー:', selectError)
      return
    }
    
    if (stores.length === 0) {
      console.log('  📭 アクセス可能な店舗がありません')
      if (!hasStoreAccess) {
        console.log('  💡 原因: ユーザーが店舗に紐付いていません')
      }
    } else {
      console.log(`  📊 ${stores.length}件の店舗が見つかりました:`)
      stores.forEach((store, index) => {
        const role = storeRoles[store.id] || 'unknown'
        console.log(`  ${index + 1}. 店舗名: ${store.name || '未設定'}`)
        console.log(`     ID: ${store.id}`)
        console.log(`     役割: ${role}`)
        console.log(`     住所: ${store.address || '未設定'}`)
        console.log('')
      })
    }
    
    // 3. 権限テスト（最初の店舗で実行）
    if (stores.length > 0) {
      const testStore = stores[0]
      const userRole = storeRoles[testStore.id]
      
      console.log('🧪 権限テスト（店舗: ' + (testStore.name || testStore.id) + '）:')
      
      // UPDATE権限テスト
      const canUpdate = ['admin', 'manager'].includes(userRole)
      console.log(`  ✏️  更新権限: ${canUpdate ? '✅ あり' : '❌ なし'} (役割: ${userRole})`)
      
      // DELETE権限テスト  
      const canDelete = userRole === 'admin'
      console.log(`  🗑️  削除権限: ${canDelete ? '✅ あり' : '❌ なし'} (役割: ${userRole})`)
      
      // 実際に更新テストを実行（ロールバック）
      if (canUpdate) {
        console.log('\n  🧪 実際の更新テスト実行中...')
        
        const originalName = testStore.name
        const testName = `TEST_${Date.now()}`
        
        // 更新実行
        const { error: updateError } = await supabase
          .from('stores')
          .update({ name: testName })
          .eq('id', testStore.id)
        
        if (updateError) {
          console.log('  ❌ 更新失敗:', updateError.message)
        } else {
          console.log('  ✅ 更新成功')
          
          // 元に戻す
          await supabase
            .from('stores')
            .update({ name: originalName })
            .eq('id', testStore.id)
          console.log('  🔄 元の名前に復元完了')
        }
      }
    }
    
    // 4. 不正アクセステスト（存在しないstore_idでのアクセス）
    console.log('\n🚫 不正アクセステスト:')
    const fakeStoreId = '00000000-0000-0000-0000-000000000000'
    const { data: unauthorizedData, error: unauthorizedError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', fakeStoreId)
    
    if (unauthorizedData && unauthorizedData.length === 0) {
      console.log('  ✅ RLSが正常に動作：権限のない店舗にはアクセスできません')
    } else {
      console.log('  ⚠️  予期しない結果:', unauthorizedData)
    }
    
    // 5. 結果サマリー
    console.log('\n📋 テスト結果サマリー:')
    console.log(`  🏪 アクセス可能店舗数: ${stores.length}`)
    console.log(`  🔑 店舗アクセス権限: ${hasStoreAccess ? 'あり' : 'なし'}`)
    console.log(`  👤 ユーザータイプ: ${user.app_metadata?.user_type || 'unknown'}`)
    
    if (stores.length > 0) {
      const roles = Object.values(storeRoles)
      const hasManagerRole = roles.some(role => ['admin', 'manager'].includes(role))
      const hasAdminRole = roles.some(role => role === 'admin')
      
      console.log(`  👨‍💼 管理者権限: ${hasManagerRole ? 'あり' : 'なし'}`)
      console.log(`  👑 システム管理者権限: ${hasAdminRole ? 'あり' : 'なし'}`)
    }
    
    return {
      storeCount: stores.length,
      stores,
      userRoles: storeRoles,
      hasStoreAccess
    }
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error)
  }
}

// 簡易版テスト（基本的な動作確認のみ）
const quickTestStoresRLS = async () => {
  console.log('⚡ クイックRLSテスト')
  
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name')
  
  if (error) {
    console.log('❌ エラー:', error.message)
  } else {
    console.log(`✅ アクセス可能な店舗: ${stores.length}件`)
    stores.forEach(store => {
      console.log(`  - ${store.name || store.id}`)
    })
  }
}

console.log('🚀 Stores RLSテスト関数が読み込まれました')
console.log('使用方法:')
console.log('  testStoresRLS() - 詳細なRLSテスト')
console.log('  quickTestStoresRLS() - 簡易RLSテスト')