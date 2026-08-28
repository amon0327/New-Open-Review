// stores テーブルの閲覧専用RLSポリシーをテストするコード
// ブラウザのコンソールで実行

const testStoresReadOnly = async () => {
  try {
    console.log('👀 Stores 閲覧専用RLSテスト開始...\n')
    
    // 1. 現在のJWTクレームを確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('❌ ユーザーがログインしていません')
      return
    }
    
    const storeIds = user.app_metadata?.store_ids || []
    const hasStoreAccess = user.app_metadata?.has_store_access || false
    
    console.log('📋 ユーザーのJWTクレーム:')
    console.log('  Store IDs:', storeIds)
    console.log('  Has Store Access:', hasStoreAccess)
    console.log('')
    
    // 2. stores テーブルから全データを取得（RLSによりフィルタされる）
    console.log('🏪 閲覧可能な店舗一覧:')
    const { data: stores, error: selectError } = await supabase
      .from('stores')
      .select('id, name, address, created_at, company_id')
      .order('created_at', { ascending: false })
    
    if (selectError) {
      console.error('❌ 店舗取得エラー:', selectError)
      return
    }
    
    if (stores.length === 0) {
      console.log('  📭 閲覧可能な店舗がありません')
      if (!hasStoreAccess) {
        console.log('  💡 原因: ユーザーが店舗に紐付いていません')
      } else {
        console.log('  💡 JWTには店舗アクセス権限がありますが、該当する店舗が見つかりません')
      }
    } else {
      console.log(`  📊 ${stores.length}件の店舗が見つかりました:`)
      stores.forEach((store, index) => {
        console.log(`  ${index + 1}. 店舗名: ${store.name || '未設定'}`)
        console.log(`     ID: ${store.id}`)
        console.log(`     住所: ${store.address || '未設定'}`)
        console.log(`     会社ID: ${store.company_id || '未設定'}`)
        console.log(`     作成日: ${new Date(store.created_at).toLocaleString()}`)
        console.log('')
      })
    }
    
    // 3. 書き込み権限テスト（すべて失敗するはず）
    console.log('🚫 書き込み権限テスト（すべて失敗するはずです）:')
    
    // INSERT テスト
    console.log('  📝 INSERT テスト...')
    const { error: insertError } = await supabase
      .from('stores')
      .insert({
        name: 'テスト店舗',
        address: 'テスト住所'
      })
    
    if (insertError) {
      console.log('  ✅ INSERT正常に拒否:', insertError.message)
    } else {
      console.log('  ❌ INSERT が実行されました（予期しない動作）')
    }
    
    // UPDATE テスト（最初の店舗があれば実行）
    if (stores.length > 0) {
      console.log('  ✏️  UPDATE テスト...')
      const { error: updateError } = await supabase
        .from('stores')
        .update({ name: 'テスト更新' })
        .eq('id', stores[0].id)
      
      if (updateError) {
        console.log('  ✅ UPDATE正常に拒否:', updateError.message)
      } else {
        console.log('  ❌ UPDATE が実行されました（予期しない動作）')
      }
      
      // DELETE テスト
      console.log('  🗑️  DELETE テスト...')
      const { error: deleteError } = await supabase
        .from('stores')
        .delete()
        .eq('id', stores[0].id)
      
      if (deleteError) {
        console.log('  ✅ DELETE正常に拒否:', deleteError.message)
      } else {
        console.log('  ❌ DELETE が実行されました（予期しない動作）')
      }
    }
    
    // 4. 結果サマリー
    console.log('\n📋 テスト結果サマリー:')
    console.log(`  🏪 閲覧可能店舗数: ${stores.length}`)
    console.log(`  🔑 店舗アクセス権限: ${hasStoreAccess ? 'あり' : 'なし'}`)
    console.log(`  👀 アクセスモード: 閲覧専用`)
    console.log(`  🛡️  RLSポリシー: アクティブ`)
    
    // 5. 店舗情報の詳細表示
    if (stores.length > 0) {
      console.log('\n📊 店舗詳細情報:')
      const storeInfo = stores.map(store => ({
        id: store.id,
        name: store.name || '未設定',
        address: store.address || '未設定',
        hasAccess: storeIds.includes(store.id)
      }))
      
      console.table(storeInfo)
    }
    
    return {
      storeCount: stores.length,
      stores,
      hasStoreAccess,
      accessMode: 'readonly'
    }
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error)
  }
}

// 簡易版テスト（基本的な閲覧確認のみ）
const quickReadOnlyTest = async () => {
  console.log('⚡ クイック閲覧テスト')
  
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name')
  
  if (error) {
    console.log('❌ エラー:', error.message)
  } else {
    console.log(`👀 閲覧可能な店舗: ${stores.length}件`)
    if (stores.length > 0) {
      stores.forEach(store => {
        console.log(`  - ${store.name || store.id}`)
      })
    } else {
      console.log('  📭 閲覧可能な店舗がありません')
    }
  }
}

// JWTクレームのみ確認
const checkJWTClaims = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    console.log('🔑 現在のJWTクレーム:')
    console.log('  Store IDs:', user.app_metadata?.store_ids || [])
    console.log('  Has Store Access:', user.app_metadata?.has_store_access || false)
    console.log('  Store Count:', user.app_metadata?.store_count || 0)
  } else {
    console.log('❌ ログインしていません')
  }
}

console.log('👀 Stores 閲覧専用テスト関数が読み込まれました')
console.log('使用方法:')
console.log('  testStoresReadOnly() - 詳細な閲覧専用テスト')
console.log('  quickReadOnlyTest() - 簡易閲覧テスト')
console.log('  checkJWTClaims() - JWTクレーム確認のみ')