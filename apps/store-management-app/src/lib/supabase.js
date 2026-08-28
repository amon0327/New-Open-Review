import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  },
  db: {
    schema: 'public'
  }
})

// 現在のユーザー取得
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting current user:', error)
      return null
    }
    return user
  } catch (error) {
    console.error('Exception in getCurrentUser:', error)
    return null
  }
}

// 現在のセッション取得
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting current session:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('Exception in getCurrentSession:', error)
    return null
  }
}

// Googleログイン
export const signInWithGoogle = async (options = {}) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: options.redirectTo || `${window.location.origin}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    
    if (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in signInWithGoogle:', error)
    throw error
  }
}

// ログアウト
export const signOut = async () => {
  try {
    console.log('🔄 Starting signOut process...')
    
    // ローカルストレージもクリア
    localStorage.removeItem('supabase.auth.token')
    sessionStorage.clear()
    
    const { error } = await supabase.auth.signOut({
      scope: 'global'
    })
    
    if (error) {
      console.error('❌ Error signing out:', error)
      throw error
    }
    
    console.log('✅ SignOut successful')
    
    // 強制的にログインページにリダイレクト
    window.location.href = '/login'
    
  } catch (error) {
    console.error('❌ Exception in signOut:', error)
    // エラーが発生してもログインページにリダイレクト
    window.location.href = '/login'
    throw error
  }
}

// 店舗権限チェック - 無限再帰エラー対策版
export const checkStorePermission = async (userId) => {
  try {
    console.log('🔍 checkStorePermission: Starting permission check for user:', userId)
    
    if (!userId) {
      console.log('❌ checkStorePermission: No user ID provided')
      return { hasPermission: false, error: 'ユーザーIDが提供されていません' }
    }
    
    // 単一クエリで必要な情報を一度に取得（RLS循環参照を回避）
    console.log('🔍 checkStorePermission: Querying with JOIN to avoid RLS recursion...')
    const { data: result, error: joinError } = await supabase
      .from('business_users')
      .select(`
        id,
        store_memberships (
          id,
          role,
          store_id
        )
      `)
      .eq('id', userId)
      .single()
    
    console.log('🔍 checkStorePermission: JOIN query result:', { result, joinError })
    
    if (joinError) {
      console.error('❌ checkStorePermission: Error in JOIN query:', joinError)
      
      // JOINが失敗した場合のフォールバック: 個別クエリに戻す
      console.log('🔄 checkStorePermission: Falling back to separate queries...')
      
      // business_usersテーブルでユーザーIDを取得
      const { data: businessUser, error: businessUserError } = await supabase
        .from('business_users')
        .select('id')
        .eq('id', userId)
        .single()
      
      if (businessUserError || !businessUser) {
        console.error('❌ checkStorePermission: Error finding business user in fallback:', businessUserError)
        return { hasPermission: false, error: 'ビジネスユーザーが見つかりません' }
      }
      
      // RLSポリシーを回避するために、より限定的なクエリを実行
      const { data: membership, error: membershipError } = await supabase
        .from('store_memberships')
        .select('id, role, store_id')
        .eq('business_user_id', businessUser.id)
        .limit(1)
        .maybeSingle() // singleの代わりにmaybeSingleを使用
      
      if (membershipError) {
        console.error('❌ checkStorePermission: Error checking store membership in fallback:', membershipError)
        return { hasPermission: false, error: '店舗メンバーシップの確認中にエラーが発生しました' }
      }
      
      if (!membership) {
        console.log('❌ checkStorePermission: No store membership found for business user:', businessUser.id)
        return { hasPermission: false, error: '店舗への権限がありません' }
      }
      
      console.log('✅ checkStorePermission: Store membership found via fallback:', membership)
      return { 
        hasPermission: true, 
        membership: membership,
        businessUserId: businessUser.id
      }
    }
    
    if (!result) {
      console.log('❌ checkStorePermission: No business user found for user ID:', userId)
      return { hasPermission: false, error: 'ビジネスユーザーが登録されていません' }
    }
    
    console.log('✅ checkStorePermission: Business user found:', result)
    
    // store_membershipsの関連データをチェック
    const memberships = result.store_memberships
    if (!memberships || memberships.length === 0) {
      console.log('❌ checkStorePermission: No store memberships found for business user:', result.id)
      return { hasPermission: false, error: '店舗への権限がありません' }
    }
    
    // 最初のメンバーシップを使用（通常は1つのはず）
    const membership = memberships[0]
    console.log('✅ checkStorePermission: Store membership found:', membership)
    console.log('✅ checkStorePermission: PERMISSION GRANTED')
    return { 
      hasPermission: true, 
      membership: membership,
      businessUserId: result.id
    }
    
  } catch (error) {
    console.error('❌ checkStorePermission: Exception occurred:', error)
    return { hasPermission: false, error: '権限チェック中にエラーが発生しました' }
  }
}

// ユーザープロファイルをデータベースに保存/更新
export const upsertUserProfile = async (user) => {
  try {
    console.log('🔄 upsertUserProfile: Upserting user profile:', user)
    
    if (!user || !user.id) {
      console.log('❌ upsertUserProfile: Invalid user data')
      return { error: 'Invalid user data' }
    }
    
    const { error } = await supabase
      .from('business_users')
      .upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
        profile_image: user.user_metadata?.avatar_url
      }, {
        onConflict: 'id'
      })

    if (error) {
      console.error('❌ upsertUserProfile: Error upserting user profile:', error)
      return { error }
    } else {
      console.log('✅ upsertUserProfile: User profile upserted successfully')
      return { error: null }
    }
  } catch (error) {
    console.error('❌ upsertUserProfile: Exception in upsertUserProfile:', error)
    return { error }
  }
}

// ユーザーのすべての店舗権限を取得（複数店舗対応）
// 注: 2026-05 から get-user-permissions Edge Function に集約。
//   - service_role で動くので RLS タイミング問題を回避
//   - business_users が未作成のケースで Edge Function 内で自動 INSERT
//   - サーバーログで失敗原因を追える
// 失敗時は 旧クライアント実装にフォールバックする (互換性確保)。
export const getUserStorePermissions = async (userId) => {
  if (!userId) {
    return { hasPermission: false, error: 'ユーザーIDが提供されていません', stores: [] }
  }

  // === Edge Function 経由 (推奨パス、3 回までリトライ) ===
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🔍 getUserStorePermissions: Calling Edge Function (attempt ${attempt}) for user:`, userId)
      // session を毎回取得 (token 期限切れ対策)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) {
        console.warn('⚠️ getUserStorePermissions: no access token in session, skip Edge Function')
        break
      }
      const { data, error } = await supabase.functions.invoke('get-user-permissions', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {},
      })
      if (!error && data?.success) {
        if (data.hasPermission) {
          console.log('✅ getUserStorePermissions(EdgeFn): Permission granted for', data.stores?.length, 'stores')
          return {
            hasPermission: true,
            stores: data.stores,
            businessUserId: data.businessUserId,
            defaultStore: data.defaultStore,
          }
        }
        // hasPermission:false の場合は サーバーで断定された結果なのでリトライしない
        console.log('❌ getUserStorePermissions(EdgeFn): No permission -', data.error)
        return { hasPermission: false, error: data.error || '店舗への権限がありません', stores: [] }
      }
      console.warn(`⚠️ getUserStorePermissions(EdgeFn attempt ${attempt}): failed`, { error, data })
      if (attempt < 3) {
        // 指数バックオフ風 (0.5s, 1.0s)
        await new Promise(r => setTimeout(r, 500 * attempt))
        continue
      }
    } catch (e) {
      console.warn(`⚠️ getUserStorePermissions(EdgeFn attempt ${attempt}): exception:`, e?.message)
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 500 * attempt))
        continue
      }
    }
  }
  console.warn('⚠️ getUserStorePermissions: Edge Function unavailable, falling back to client query')

  // === 旧クライアント実装 (フォールバック) ===
  try {
    console.log('🔍 getUserStorePermissions(fallback): Starting client-side check for user:', userId)
    
    // 段階的に店舗情報を取得してJOINの問題を特定
    console.log('🔍 getUserStorePermissions: Step 1 - Getting business user...')
    const { data: businessUserCheck, error: businessUserCheckError } = await supabase
      .from('business_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    
    console.log('🔍 getUserStorePermissions: Business user check:', { businessUserCheck, businessUserCheckError })
    
    if (!businessUserCheck) {
      console.log('❌ getUserStorePermissions: Business user not found')
      return { hasPermission: false, error: 'ビジネスユーザーが登録されていません', stores: [] }
    }
    
    console.log('🔍 getUserStorePermissions: Step 2 - Getting store memberships without JOIN...')
    const { data: membershipsOnly, error: membershipsOnlyError } = await supabase
      .from('store_memberships')
      .select('id, role, store_id, business_user_id, company_id')
      .eq('business_user_id', businessUserCheck.id)

    console.log('🔍 getUserStorePermissions: Memberships only:', { membershipsOnly, membershipsOnlyError })
    
    console.log('🔍 getUserStorePermissions: Step 3 - Testing stores table access...')
    const { data: storesCheck, error: storesCheckError } = await supabase
      .from('stores')
      .select('id, name, address, staff_view_mode, answer_cooldown_days')
      .limit(1)
    
    console.log('🔍 getUserStorePermissions: Stores table check:', { storesCheck, storesCheckError })
    
    console.log('🔍 getUserStorePermissions: Step 4 - Attempting JOIN query...')
    const { data: result, error: joinError } = await supabase
      .from('business_users')
      .select(`
        id,
        store_memberships (
          id,
          role,
          store_id,
          company_id,
          stores (
            id,
            name,
            address,
            staff_view_mode,
            answer_cooldown_days,
            company_id
          )
        )
      `)
      .eq('id', userId)
      .maybeSingle()
    
    console.log('🔍 getUserStorePermissions: JOIN query result:', { result, joinError })
    
    // 詳細なデータ構造のデバッグ
    if (result && result.store_memberships) {
      console.log('🔍 getUserStorePermissions: Detailed membership data:')
      result.store_memberships.forEach((membership, index) => {
        console.log(`  Membership ${index}:`, {
          id: membership.id,
          role: membership.role,
          store_id: membership.store_id,
          stores: membership.stores,
          hasStoresObject: !!membership.stores,
          storesName: membership.stores?.name || 'NOT FOUND',
          fullMembership: membership
        })
      })
    }
    
    if (joinError) {
      console.error('❌ getUserStorePermissions: Error in JOIN query:', joinError)
      
      // フォールバック: 個別クエリで店舗メンバーシップを取得
      console.log('🔄 getUserStorePermissions: Falling back to manual JOIN with separate queries...')
      
      // membershipsOnlyのデータを使用して手動でJOINを実行
      if (membershipsOnly && membershipsOnly.length > 0) {
        console.log('🔍 getUserStorePermissions: Manual JOIN - Getting store details for each membership...')
        
        const membershipsWithStores = []
        
        for (const membership of membershipsOnly) {
          console.log(`🔍 Getting store details for store_id: ${membership.store_id}`)
          
          // 各店舗の詳細情報を個別に取得
          const { data: storeDetail, error: storeDetailError } = await supabase
            .from('stores')
            .select('id, name, address, staff_view_mode, answer_cooldown_days')
            .eq('id', membership.store_id)
            .maybeSingle()
          
          console.log(`🔍 Store detail for ${membership.store_id}:`, { storeDetail, storeDetailError })
          
          // 店舗情報を手動でJOIN
          const membershipWithStore = {
            ...membership,
            stores: storeDetail || null
          }
          
          membershipsWithStores.push(membershipWithStore)
          
          console.log(`🔍 Manual JOIN result for membership ${membership.id}:`, {
            store_id: membership.store_id,
            hasStoreData: !!storeDetail,
            storeName: storeDetail?.name || 'NOT FOUND',
            membershipWithStore
          })
        }
        
        console.log('✅ getUserStorePermissions: Manual JOIN completed:', membershipsWithStores)
        
        return { 
          hasPermission: true, 
          stores: membershipsWithStores,
          businessUserId: businessUserCheck.id,
          defaultStore: membershipsWithStores[0],
          fallbackMethod: 'manual_join'
        }
      }
      
      console.log('❌ getUserStorePermissions: No memberships available for fallback')
      return { hasPermission: false, error: '店舗への権限がありません', stores: [] }
    }
    
    if (!result) {
      console.log('❌ getUserStorePermissions: No business user found for user ID:', userId)
      return { hasPermission: false, error: 'ビジネスユーザーが登録されていません', stores: [] }
    }
    
    const memberships = result.store_memberships
    if (!memberships || memberships.length === 0) {
      console.log('❌ getUserStorePermissions: No store memberships found for user:', userId)
      return { hasPermission: false, error: '店舗への権限がありません', stores: [] }
    }
    
    console.log('✅ getUserStorePermissions: Store memberships found:', memberships)
    console.log('✅ getUserStorePermissions: PERMISSION GRANTED for', memberships.length, 'stores')
    
    return { 
      hasPermission: true, 
      stores: memberships,
      businessUserId: result.id,
      defaultStore: memberships[0] // 最初の店舗をデフォルトに設定
    }
    
  } catch (error) {
    console.error('❌ getUserStorePermissions: Exception occurred:', error)
    return { hasPermission: false, error: '権限チェック中にエラーが発生しました', stores: [] }
  }
}

// state パラメータを base64url でエンコード/デコードするユーティリティ
// LINE OAuth の state は最大 200 バイト程度まで安全に乗るため、ここに redirectPath を埋め込む
const encodeLineState = (payload) => {
  const json = JSON.stringify(payload)
  // base64url（URL セーフ。LINE 側で URL エンコード後も安全）
  const base64 = btoa(unescape(encodeURIComponent(json)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const decodeLineState = (state) => {
  if (!state) return null
  try {
    const base64 = state.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = decodeURIComponent(escape(atob(padded)))
    return JSON.parse(json)
  } catch (e) {
    // 旧形式（ランダム文字列のみ）の state は payload を含まない
    return null
  }
}

// LINEログイン
export const signInWithLine = async (redirectPath = null) => {
  try {
    // CSRF 保護用のランダム値
    const csrf = Math.random().toString(36).substring(2, 15)

    // state に CSRF と redirectPath を一緒に埋め込む
    // → LINE callback で URL から確実に取り出せる（localStorage に依存しない）
    const state = encodeLineState({
      csrf,
      redirectPath: redirectPath || '/'
    })

    // フォールバック用にローカルにも保存（同一ブラウザでの戻り経路向け）
    localStorage.setItem('lineLoginState', csrf)
    if (redirectPath) {
      localStorage.setItem('lineLoginRedirectPath', redirectPath)
    }

    // LINE OAuth URL
    const lineClientId = import.meta.env.VITE_LINE_CHANNEL_ID || '2008392816'
    const lineRedirectUri = import.meta.env.VITE_LINE_REDIRECT_URI ||
      (import.meta.env.MODE === 'production'
        ? 'https://store-management-app.web.app/auth/line/callback'
        : 'http://localhost:5173/auth/line/callback')

    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
      `response_type=code&` +
      `client_id=${lineClientId}&` +
      `redirect_uri=${encodeURIComponent(lineRedirectUri)}&` +
      `state=${encodeURIComponent(state)}&` +
      `scope=profile%20openid`

    // Redirect to LINE login
    window.location.href = lineLoginUrl
  } catch (error) {
    console.error('Exception in signInWithLine:', error)
    throw error
  }
}

// 認証状態監視のヘルパー
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}