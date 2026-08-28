// ログイン後すぐにログイン画面に戻る問題の詳細デバッグツール
// ブラウザのコンソールで実行

const debugAuthFlow = {
  
  // 1. 現在の認証状態を詳細に確認
  async checkCurrentAuthState() {
    console.log('🔍 === 現在の認証状態チェック ===')
    
    try {
      // Supabaseの認証状態
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      console.log('📋 Supabase認証情報:')
      console.log('  Session:', session)
      console.log('  Session Error:', sessionError)
      console.log('  User:', user)
      console.log('  User Error:', userError)
      console.log('  User ID:', user?.id)
      console.log('  User Email:', user?.email)
      
      // AuthContextの状態（React DevToolsから取得）
      const authContext = window.React?.useContext ? 'React Context利用可能' : 'React Context利用不可'
      console.log('  AuthContext:', authContext)
      
      // JWT内容確認
      if (session?.access_token) {
        try {
          const payload = JSON.parse(atob(session.access_token.split('.')[1]))
          console.log('📋 JWT Payload:')
          console.log('  User ID:', payload.sub)
          console.log('  Email:', payload.email)
          console.log('  App Metadata:', payload.app_metadata)
          console.log('  User Metadata:', payload.user_metadata)
          console.log('  Expires:', new Date(payload.exp * 1000))
          console.log('  Role:', payload.role)
        } catch (e) {
          console.log('❌ JWT解析エラー:', e)
        }
      }
      
      // ローカルストレージ確認
      console.log('📋 LocalStorage:')
      console.log('  selectedStoreId:', localStorage.getItem('selectedStoreId'))
      console.log('  supabase keys:', Object.keys(localStorage).filter(k => k.includes('supabase')))
      
      return { session, user, sessionError, userError }
      
    } catch (error) {
      console.error('❌ 認証状態チェックエラー:', error)
      return { error }
    }
  },
  
  // 2. 権限チェックプロセスを詳細監視
  async checkPermissions() {
    console.log('🔍 === 権限チェックプロセス ===')
    
    try {
      const { user } = await this.checkCurrentAuthState()
      
      if (!user) {
        console.log('❌ ユーザーが存在しないため権限チェックスキップ')
        return
      }
      
      console.log('🔄 権限チェック開始...')
      
      // 1. business_usersテーブルチェック
      console.log('📋 Step 1: business_users確認')
      const { data: businessUser, error: businessUserError } = await supabase
        .from('business_users')
        .select('id, email, name')
        .eq('id', user.id)
        .maybeSingle()
      
      console.log('  Business User:', businessUser)
      console.log('  Business User Error:', businessUserError)
      
      if (!businessUser) {
        console.log('❌ business_usersテーブルにユーザーが存在しない')
        return { hasPermission: false, error: 'business_user_not_found' }
      }
      
      // 2. store_membershipsテーブルチェック
      console.log('📋 Step 2: store_memberships確認')
      const { data: memberships, error: membershipsError } = await supabase
        .from('store_memberships')
        .select('id, role, store_id, business_user_id')
        .eq('business_user_id', businessUser.id)
      
      console.log('  Memberships:', memberships)
      console.log('  Memberships Error:', membershipsError)
      
      if (!memberships || memberships.length === 0) {
        console.log('❌ store_membershipsにデータが存在しない')
        return { hasPermission: false, error: 'no_store_memberships' }
      }
      
      // 3. storesテーブルとのJOIN確認
      console.log('📋 Step 3: stores情報取得')
      const storeIds = memberships.map(m => m.store_id)
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name, address')
        .in('id', storeIds)
      
      console.log('  Stores:', stores)
      console.log('  Stores Error:', storesError)
      
      // 4. 手動でJOINした結果を作成
      const fullMemberships = memberships.map(membership => ({
        ...membership,
        stores: stores?.find(store => store.id === membership.store_id) || null
      }))
      
      console.log('📋 Step 4: 最終的なメンバーシップデータ')
      fullMemberships.forEach((membership, index) => {
        console.log(`  Membership ${index}:`, {
          store_id: membership.store_id,
          role: membership.role,
          store_name: membership.stores?.name || 'NOT FOUND',
          has_store_data: !!membership.stores
        })
      })
      
      return {
        hasPermission: true,
        stores: fullMemberships,
        businessUserId: businessUser.id
      }
      
    } catch (error) {
      console.error('❌ 権限チェックエラー:', error)
      return { hasPermission: false, error: error.message }
    }
  },
  
  // 3. RLSポリシーのテスト
  async testRLSPolicies() {
    console.log('🔍 === RLSポリシーテスト ===')
    
    try {
      // stores テーブルへのアクセステスト
      console.log('📋 stores テーブルアクセステスト:')
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .limit(5)
      
      console.log('  Accessible Stores:', storesData)
      console.log('  Stores Error:', storesError)
      
      // business_users テーブルへのアクセステスト
      console.log('📋 business_users テーブルアクセステスト:')
      const { data: businessUsersData, error: businessUsersError } = await supabase
        .from('business_users')
        .select('id, email')
        .limit(5)
      
      console.log('  Accessible Business Users:', businessUsersData)
      console.log('  Business Users Error:', businessUsersError)
      
      // store_memberships テーブルへのアクセステスト
      console.log('📋 store_memberships テーブルアクセステスト:')
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('store_memberships')
        .select('id, role, store_id')
        .limit(5)
      
      console.log('  Accessible Memberships:', membershipsData)
      console.log('  Memberships Error:', membershipsError)
      
      return {
        stores: { data: storesData, error: storesError },
        businessUsers: { data: businessUsersData, error: businessUsersError },
        memberships: { data: membershipsData, error: membershipsError }
      }
      
    } catch (error) {
      console.error('❌ RLSテストエラー:', error)
      return { error: error.message }
    }
  },
  
  // 4. 認証フローの問題を特定
  async identifyAuthIssue() {
    console.log('🔍 === 認証問題の特定 ===')
    
    const authState = await this.checkCurrentAuthState()
    const permissions = await this.checkPermissions()
    const rlsTest = await this.testRLSPolicies()
    
    console.log('📋 問題分析:')
    
    // 問題1: ユーザー認証
    if (!authState.user) {
      console.log('❌ 問題1: ユーザーが認証されていない')
      console.log('  原因: セッションが無効またはログイン失敗')
      return 'authentication_failed'
    }
    
    // 問題2: business_usersテーブル
    if (permissions.error === 'business_user_not_found') {
      console.log('❌ 問題2: business_usersテーブルにユーザーが存在しない')
      console.log('  原因: ユーザー登録処理が未完了')
      return 'business_user_missing'
    }
    
    // 問題3: 店舗権限
    if (permissions.error === 'no_store_memberships') {
      console.log('❌ 問題3: 店舗への権限が設定されていない')
      console.log('  原因: store_membershipsテーブルにデータがない')
      return 'no_store_permissions'
    }
    
    // 問題4: RLSポリシー
    if (rlsTest.stores?.error || rlsTest.businessUsers?.error || rlsTest.memberships?.error) {
      console.log('❌ 問題4: RLSポリシーによるアクセス拒否')
      console.log('  原因: JWTクレームまたはRLSポリシーの設定問題')
      return 'rls_policy_issue'
    }
    
    // 問題5: 店舗データの不整合
    if (permissions.hasPermission && permissions.stores) {
      const storesWithoutData = permissions.stores.filter(s => !s.stores)
      if (storesWithoutData.length > 0) {
        console.log('⚠️ 問題5: 一部の店舗データが取得できない')
        console.log('  影響する店舗:', storesWithoutData.map(s => s.store_id))
        return 'partial_store_data_missing'
      }
    }
    
    console.log('✅ 認証フローに明確な問題は検出されませんでした')
    return 'no_obvious_issues'
  },
  
  // 5. 包括的なデバッグ実行
  async runFullDebug() {
    console.log('🚀 === 包括的認証デバッグ開始 ===')
    
    const results = {
      authState: await this.checkCurrentAuthState(),
      permissions: await this.checkPermissions(),
      rlsTest: await this.testRLSPolicies(),
      issue: await this.identifyAuthIssue()
    }
    
    console.log('📋 === デバッグ結果サマリー ===')
    console.log('認証状態:', results.authState.user ? '✅ 認証済み' : '❌ 未認証')
    console.log('権限状態:', results.permissions.hasPermission ? '✅ 権限あり' : '❌ 権限なし')
    console.log('特定された問題:', results.issue)
    
    // 推奨される対処法
    console.log('📋 === 推奨対処法 ===')
    switch (results.issue) {
      case 'authentication_failed':
        console.log('🔧 Googleログインを再実行してください')
        break
      case 'business_user_missing':
        console.log('🔧 business_usersテーブルにユーザーデータを追加してください')
        break
      case 'no_store_permissions':
        console.log('🔧 store_membershipsテーブルに権限データを追加してください')
        break
      case 'rls_policy_issue':
        console.log('🔧 RLSポリシーまたはJWTクレーム設定を確認してください')
        break
      case 'partial_store_data_missing':
        console.log('🔧 storesテーブルのデータ整合性を確認してください')
        break
      default:
        console.log('🔧 ブラウザの開発者ツールでネットワークタブを確認してください')
    }
    
    return results
  }
}

// 使用方法
console.log('🚀 認証フローデバッグツールが読み込まれました')
console.log('使用方法:')
console.log('  debugAuthFlow.runFullDebug() - 包括的デバッグ実行')
console.log('  debugAuthFlow.checkCurrentAuthState() - 認証状態確認')
console.log('  debugAuthFlow.checkPermissions() - 権限チェック')
console.log('  debugAuthFlow.testRLSPolicies() - RLSポリシーテスト')
console.log('  debugAuthFlow.identifyAuthIssue() - 問題特定')

// すぐに実行したい場合はコメントアウトを外す
// debugAuthFlow.runFullDebug();