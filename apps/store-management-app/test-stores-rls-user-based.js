// ユーザーIDベースのstores RLSポリシーをテストするコード
// ブラウザのコンソールで実行

const testUserBasedStoresRLS = {
  
  // 1. 現在のユーザー情報と権限を確認
  async checkUserInfo() {
    console.log('🔍 === ユーザー情報と権限確認 ===')
    
    try {
      // Supabaseの認証情報
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('❌ ユーザー取得エラー:', error)
        return
      }
      
      if (!user) {
        console.log('❌ ユーザーがログインしていません')
        return
      }
      
      console.log('📋 認証ユーザー情報:')
      console.log('  User ID:', user.id)
      console.log('  Email:', user.email)
      console.log('  Role:', user.role)
      
      // SQLで現在のauth.uid()を確認
      const { data: authCheck, error: authError } = await supabase
        .rpc('sql', { 
          query: 'SELECT auth.uid() as current_user_id, auth.role() as current_role' 
        })
      
      if (!authError && authCheck) {
        console.log('📋 Supabase auth関数の結果:')
        console.log('  auth.uid():', authCheck[0]?.current_user_id)
        console.log('  auth.role():', authCheck[0]?.current_role)
      }
      
      return user
      
    } catch (error) {
      console.error('❌ ユーザー情報確認エラー:', error)
    }
  },
  
  // 2. ユーザーの店舗権限を詳細確認
  async checkUserStorePermissions() {
    console.log('🔍 === ユーザーの店舗権限確認 ===')
    
    try {
      const user = await this.checkUserInfo()
      if (!user) return
      
      // business_usersテーブルでユーザー確認
      console.log('📋 Step 1: business_users確認')
      const { data: businessUser, error: businessUserError } = await supabase
        .from('business_users')
        .select('id, email, name')
        .eq('id', user.id)
        .maybeSingle()
      
      console.log('  Business User:', businessUser)
      if (businessUserError) console.log('  Error:', businessUserError)
      
      if (!businessUser) {
        console.log('❌ business_usersテーブルにユーザーが存在しません')
        return
      }
      
      // store_membershipsでユーザーの店舗権限確認
      console.log('📋 Step 2: store_memberships確認')
      const { data: memberships, error: membershipsError } = await supabase
        .from('store_memberships')
        .select('id, store_id, role, business_user_id')
        .eq('business_user_id', businessUser.id)
      
      console.log('  Memberships:', memberships)
      if (membershipsError) console.log('  Error:', membershipsError)
      
      if (!memberships || memberships.length === 0) {
        console.log('❌ store_membershipsにデータがありません')
        return
      }
      
      // JOINクエリで店舗情報と権限を同時取得
      console.log('📋 Step 3: 店舗情報とのJOIN')
      const { data: storePermissions, error: joinError } = await supabase
        .from('business_users')
        .select(`
          id,
          email,
          store_memberships (
            store_id,
            role,
            stores (
              id,
              name,
              address
            )
          )
        `)
        .eq('id', user.id)
        .maybeSingle()
      
      console.log('  Store Permissions:', storePermissions)
      if (joinError) console.log('  Error:', joinError)
      
      return {
        businessUser,
        memberships,
        storePermissions
      }
      
    } catch (error) {
      console.error('❌ 店舗権限確認エラー:', error)
    }
  },
  
  // 3. RLSポリシーの動作テスト
  async testRLSPolicy() {
    console.log('🔍 === RLS ポリシー動作テスト ===')
    
    try {
      // stores テーブルから全データを取得（RLSによりフィルタされる）
      console.log('📋 アクセス可能な店舗一覧（RLS適用後）:')
      const { data: accessibleStores, error: storesError } = await supabase
        .from('stores')
        .select('id, name, address, created_at')
        .order('created_at', { ascending: false })
      
      if (storesError) {
        console.error('❌ 店舗取得エラー:', storesError)
        return
      }
      
      console.log(`📊 RLS適用後のアクセス可能店舗数: ${accessibleStores.length}`)
      
      if (accessibleStores.length === 0) {
        console.log('📭 アクセス可能な店舗がありません')
        console.log('💡 原因候補:')
        console.log('  1. RLSポリシーが正しく設定されていない')
        console.log('  2. business_usersまたはstore_membershipsにデータがない')
        console.log('  3. auth.uid()が正しく取得できていない')
      } else {
        console.log('📋 アクセス可能な店舗一覧:')
        accessibleStores.forEach((store, index) => {
          console.log(`  ${index + 1}. ${store.name || '未設定'} (${store.id})`)
          console.log(`     住所: ${store.address || '未設定'}`)
        })
      }
      
      return accessibleStores
      
    } catch (error) {
      console.error('❌ RLSテストエラー:', error)
    }
  },
  
  // 4. 書き込み権限テスト（全て拒否されるはず）
  async testWriteOperations() {
    console.log('🔍 === 書き込み操作テスト（拒否されるはず） ===')
    
    try {
      // INSERT テスト
      console.log('📝 INSERT テスト...')
      const { error: insertError } = await supabase
        .from('stores')
        .insert({
          name: 'テスト店舗',
          address: 'テスト住所'
        })
      
      if (insertError) {
        console.log('✅ INSERT正常に拒否:', insertError.message)
      } else {
        console.log('❌ INSERT が実行されました（予期しない動作）')
      }
      
      // 更新・削除テストは実際の店舗があれば実行
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .limit(1)
      
      if (stores && stores.length > 0) {
        const testStoreId = stores[0].id
        
        // UPDATE テスト
        console.log('✏️ UPDATE テスト...')
        const { error: updateError } = await supabase
          .from('stores')
          .update({ name: 'テスト更新' })
          .eq('id', testStoreId)
        
        if (updateError) {
          console.log('✅ UPDATE正常に拒否:', updateError.message)
        } else {
          console.log('❌ UPDATE が実行されました（予期しない動作）')
        }
        
        // DELETE テスト
        console.log('🗑️ DELETE テスト...')
        const { error: deleteError } = await supabase
          .from('stores')
          .delete()
          .eq('id', testStoreId)
        
        if (deleteError) {
          console.log('✅ DELETE正常に拒否:', deleteError.message)
        } else {
          console.log('❌ DELETE が実行されました（予期しない動作）')
        }
      }
      
    } catch (error) {
      console.error('❌ 書き込み操作テストエラー:', error)
    }
  },
  
  // 5. 包括的テスト実行
  async runFullTest() {
    console.log('🚀 === ユーザーIDベースRLS包括テスト開始 ===')
    
    const userInfo = await this.checkUserInfo()
    const permissions = await this.checkUserStorePermissions()
    const accessibleStores = await this.testRLSPolicy()
    await this.testWriteOperations()
    
    console.log('\n📋 === テスト結果サマリー ===')
    console.log('✅ ユーザー認証:', userInfo ? '成功' : '失敗')
    console.log('✅ 権限データ:', permissions ? '取得成功' : '取得失敗')
    console.log('✅ RLS動作:', accessibleStores ? `${accessibleStores.length}件の店舗にアクセス可能` : 'アクセス不可')
    
    // 問題診断
    if (!userInfo) {
      console.log('🔧 対処法: ログインし直してください')
    } else if (!permissions?.businessUser) {
      console.log('🔧 対処法: business_usersテーブルにユーザーデータを追加してください')
    } else if (!permissions?.memberships?.length) {
      console.log('🔧 対処法: store_membershipsテーブルに権限データを追加してください')
    } else if (!accessibleStores?.length) {
      console.log('🔧 対処法: RLSポリシーまたはauth.uid()の動作を確認してください')
    } else {
      console.log('🎉 RLSポリシーが正常に動作しています！')
    }
    
    return {
      userInfo,
      permissions,
      accessibleStores
    }
  }
}

// 簡易テスト用関数
const quickRLSTest = async () => {
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

console.log('🚀 ユーザーIDベースStores RLSテストツールが読み込まれました')
console.log('使用方法:')
console.log('  testUserBasedStoresRLS.runFullTest() - 包括的テスト')
console.log('  testUserBasedStoresRLS.checkUserInfo() - ユーザー情報確認')
console.log('  testUserBasedStoresRLS.testRLSPolicy() - RLS動作テスト')
console.log('  quickRLSTest() - 簡易テスト')