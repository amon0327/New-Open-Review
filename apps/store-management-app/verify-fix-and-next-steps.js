// ログイン復旧後の動作確認とクリーンアップ
// ブラウザのコンソールで実行

const verifyLoginFix = {
  
  // 1. 基本的な認証状況確認
  async checkAuthStatus() {
    console.log('🔍 === 認証状況確認 ===')
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('❌ 認証エラー:', error)
        return false
      }
      
      if (!user) {
        console.log('❌ ユーザーがログインしていません')
        return false
      }
      
      console.log('✅ ログイン成功')
      console.log('  User ID:', user.id)
      console.log('  Email:', user.email)
      
      return true
      
    } catch (error) {
      console.error('❌ 認証確認エラー:', error)
      return false
    }
  },
  
  // 2. 各テーブルへのアクセス確認
  async checkTableAccess() {
    console.log('🔍 === テーブルアクセス確認 ===')
    
    const tables = [
      { name: 'stores', query: 'SELECT id, name FROM stores LIMIT 3' },
      { name: 'business_users', query: 'SELECT id, email FROM business_users LIMIT 3' },
      { name: 'store_memberships', query: 'SELECT business_user_id, store_id, role FROM store_memberships LIMIT 3' },
      { name: 'company_memberships', query: 'SELECT business_user_id, company_id FROM company_memberships LIMIT 3' }
    ]
    
    const results = {}
    
    for (const table of tables) {
      try {
        console.log(`📋 ${table.name} テーブルアクセステスト...`)
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: table.query 
        }).single()
        
        if (error) {
          console.log(`  ❌ ${table.name}: ${error.message}`)
          results[table.name] = { success: false, error: error.message }
        } else {
          console.log(`  ✅ ${table.name}: アクセス成功`)
          results[table.name] = { success: true, count: data?.length || 0 }
        }
        
      } catch (err) {
        // rpc が使えない場合は直接テーブルアクセス
        try {
          const { data, error } = await supabase
            .from(table.name.replace(/s$/, ''))  // 単数形に変換を試行
            .select('*')
            .limit(1)
          
          if (error) {
            console.log(`  ❌ ${table.name}: ${error.message}`)
            results[table.name] = { success: false, error: error.message }
          } else {
            console.log(`  ✅ ${table.name}: アクセス成功`)
            results[table.name] = { success: true, count: data?.length || 0 }
          }
          
        } catch (directError) {
          console.log(`  ❌ ${table.name}: ${directError.message}`)
          results[table.name] = { success: false, error: directError.message }
        }
      }
    }
    
    return results
  },
  
  // 3. 現在のRLSポリシー状況確認
  async checkRLSStatus() {
    console.log('🔍 === RLSポリシー状況確認 ===')
    
    try {
      // Supabase の system メタデータを確認
      const tables = ['stores', 'business_users', 'store_memberships', 'company_memberships']
      
      for (const tableName of tables) {
        console.log(`📋 ${tableName} テーブル:`)
        
        // 簡単なアクセステストでRLSの動作を確認
        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
          
          if (error) {
            console.log(`  ❌ RLS拒否または設定問題: ${error.message}`)
          } else {
            console.log(`  ✅ アクセス可能: ${count} 件`)
          }
        } catch (err) {
          console.log(`  ❌ テーブルアクセスエラー: ${err.message}`)
        }
      }
      
    } catch (error) {
      console.error('❌ RLS状況確認エラー:', error)
    }
  },
  
  // 4. AuthContextの動作確認
  async checkAuthContext() {
    console.log('🔍 === AuthContext動作確認 ===')
    
    // AuthContext の状態確認（React DevTools があれば）
    if (typeof window !== 'undefined' && window.React) {
      console.log('📋 React環境検出済み')
      console.log('  AuthContext の詳細確認は React DevTools を使用してください')
    }
    
    // 直接的な店舗権限チェック
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        console.log('📋 ユーザーの店舗権限チェック...')
        
        // business_users 確認
        const { data: businessUser } = await supabase
          .from('business_users')
          .select('id, email')
          .eq('id', user.id)
          .maybeSingle()
        
        if (businessUser) {
          console.log('✅ business_users に存在')
          
          // store_memberships 確認
          const { data: memberships } = await supabase
            .from('store_memberships')
            .select('store_id, role')
            .eq('business_user_id', user.id)
          
          console.log(`✅ 店舗メンバーシップ: ${memberships?.length || 0} 件`)
          
        } else {
          console.log('❌ business_users に存在しません')
        }
      }
      
    } catch (error) {
      console.error('❌ AuthContext確認エラー:', error)
    }
  },
  
  // 5. 包括的な動作確認
  async runFullVerification() {
    console.log('🚀 === ログイン修正後の包括的確認開始 ===')
    
    const authOk = await this.checkAuthStatus()
    if (!authOk) {
      console.log('❌ 認証に問題があります。確認を中止します。')
      return
    }
    
    const tableAccess = await this.checkTableAccess()
    await this.checkRLSStatus()
    await this.checkAuthContext()
    
    console.log('\n📋 === 確認結果サマリー ===')
    console.log('✅ 認証状態: 正常')
    
    Object.entries(tableAccess).forEach(([table, result]) => {
      const status = result.success ? '✅ 正常' : '❌ 問題あり'
      console.log(`${status} ${table}: ${result.success ? 'アクセス可能' : result.error}`)
    })
    
    console.log('\n🎯 次のステップ:')
    console.log('1. アプリの主要機能をテスト')
    console.log('2. 店舗データの表示確認')
    console.log('3. 必要に応じてRLSポリシーの再設定')
    
    return {
      authOk,
      tableAccess
    }
  }
}

// 簡易確認用
const quickCheck = async () => {
  console.log('⚡ クイック動作確認')
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    console.log('認証:', user ? '✅ OK' : '❌ NG')
    
    const { data: stores } = await supabase.from('stores').select('id').limit(1)
    console.log('stores アクセス:', stores ? '✅ OK' : '❌ NG')
    
  } catch (error) {
    console.log('❌ エラー:', error.message)
  }
}

console.log('🚀 ログイン修正確認ツールが読み込まれました')
console.log('使用方法:')
console.log('  verifyLoginFix.runFullVerification() - 包括的確認')
console.log('  quickCheck() - 簡易確認')
console.log('  verifyLoginFix.checkTableAccess() - テーブルアクセス確認のみ')