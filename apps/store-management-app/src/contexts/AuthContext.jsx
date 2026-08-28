import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { 
  supabase, 
  getCurrentUser, 
  getCurrentSession,
  checkStorePermission, 
  getUserStorePermissions,
  signOut as supabaseSignOut,
  upsertUserProfile,
  onAuthStateChange
} from '../lib/supabase'
import { trackLogin, trackLogout, trackSessionStart } from '../utils/analytics'
import { useAppLifecycle } from '../utils/appLifecycleManager'
// import { useAppStateDebugger } from '../utils/appStateDebugger' // 一時的に無効化

const AuthContext = createContext({})

// === 開発専用 認証バイパス ===
// import.meta.env.DEV (= vite dev server 実行時のみ true) かつ
// VITE_AUTH_BYPASS=true のときだけ有効。本番ビルドには絶対出ない。
const DEV_AUTH_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true'

const DEV_FAKE_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev-bypass@local',
  user_metadata: { full_name: 'DEV User' }
}

const DEV_FAKE_STORES = [
  {
    store_id: '00000000-0000-0000-0000-000000000aaa',
    role: 'STORE',
    company_id: '00000000-0000-0000-0000-000000000bbb',
    stores: {
      id: '00000000-0000-0000-0000-000000000aaa',
      name: '[DEV] テスト店舗 A',
      staff_view_mode: 'weekly',
      answer_cooldown_days: 5
    }
  },
  {
    store_id: '00000000-0000-0000-0000-000000000ccc',
    role: 'STORE',
    company_id: '00000000-0000-0000-0000-000000000bbb',
    stores: {
      id: '00000000-0000-0000-0000-000000000ccc',
      name: '[DEV] テスト店舗 B',
      staff_view_mode: 'realtime',
      answer_cooldown_days: 3
    }
  }
]
const DEV_FAKE_STORE = DEV_FAKE_STORES[0]

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  // 基本状態
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // デバッグ用状態ログ（初期化とユーザー変更時のみ）
  useEffect(() => {
    if (isInitialized) {
      console.log('🔍 AuthProvider State Update:', {
        user: user?.id || null,
        hasSession: !!session,
        loading,
        isInitialized,
        permissionState: permissionState.hasStorePermission,
        permissionLoading: permissionState.loading
      })
    }
  }, [user, isInitialized])
  
  // 権限管理状態（簡素化）
  const [permissionState, setPermissionState] = useState({
    hasStorePermission: null, // null, true, false
    loading: true,
    error: null,
    lastChecked: null
  })
  
  // 店舗情報
  const [storeInfo, setStoreInfo] = useState(null)
  const [userStores, setUserStores] = useState([])
  const [currentStore, setCurrentStore] = useState(null)

  // パートナーテーマ
  const [partnerTheme, setPartnerTheme] = useState(null)
  const [partnerThemeLoaded, setPartnerThemeLoaded] = useState(false)
  
  // 競合状態を防ぐためのRef
  const permissionCheckRef = useRef({
    isChecking: false,
    lastCheckTime: 0,
    debounceTimer: null
  })
  
  // AppLifecycleManagerと連携
  const lifecycle = useAppLifecycle()
  
  // デバッグ用 (簡素化版)
  const appDebugger = {
    trackPermissionCheck: (source, result, timeTaken) => {
      console.log(`🔍 AuthProvider Debug: Permission check - ${source}: ${result} (${timeTaken}ms)`)
    },
    trackAuthState: (state) => {
      console.log('🔍 AuthProvider Debug: Auth state updated', state)
    },
    trackLifecycleEvent: (event, data) => {
      console.log(`🔍 AuthProvider Debug: Lifecycle event - ${event}`, data)
    }
  }

  // 権限チェック用の簡素化された関数
  const checkUserPermissions = async (targetUser, source = 'unknown') => {
    if (!targetUser?.id) {
      console.log('❌ AuthProvider: No valid user for permission check')
      setPermissionState({
        hasStorePermission: false,
        loading: false,
        error: null,
        lastChecked: Date.now()
      })
      return
    }

    // 既にチェック中の場合はスキップ（ただし10秒以上前の場合は強制的にリセット）
    const now = Date.now()
    if (permissionCheckRef.current.isChecking) {
      const timeSinceLastCheck = now - permissionCheckRef.current.lastCheckTime
      if (timeSinceLastCheck < 10000) {
        console.log('⚠️ AuthProvider: Permission check already in progress, skipping')
        return
      } else {
        console.log('⚠️ AuthProvider: Permission check stuck, forcing reset')
        permissionCheckRef.current.isChecking = false
      }
    }

    permissionCheckRef.current.isChecking = true
    permissionCheckRef.current.lastCheckTime = now
    
    console.log(`🔍 AuthProvider: Starting permission check for user ${targetUser.id} (source: ${source})`)
    
    // 既に hasStorePermission === true が確定している場合、background 再チェック中は
    // loading フラグを立てない。立てると ProtectedRoute が LoadingScreen に切り替わり
    // CommentPage 等が一瞬アンマウントされてスクロール位置がリセットされる (新井さん報告のバグ)。
    setPermissionState(prev => {
      if (prev.hasStorePermission === true) {
        return { ...prev, error: null }
      }
      return { ...prev, loading: true, error: null }
    })
    
    try {
      const permissionResult = await getUserStorePermissions(targetUser.id)
      console.log('🔍 AuthProvider: Permission result:', permissionResult)
      
      if (permissionResult.hasPermission) {
        setUserStores(permissionResult.stores)

        // 保存された店舗を復元
        const savedStoreId = localStorage.getItem('selectedStoreId')
        let selectedStore = null

        if (savedStoreId) {
          selectedStore = permissionResult.stores.find(store => store.store_id === savedStoreId)
        }

        if (!selectedStore && permissionResult.stores.length > 0) {
          selectedStore = permissionResult.stores[0]
        }

        setCurrentStore(selectedStore)
        setStoreInfo(selectedStore)

        setPermissionState({
          hasStorePermission: true,
          loading: false,
          error: null,
          lastChecked: now
        })

        // セッション開始を追跡
        if (targetUser?.id && selectedStore?.store_id) {
          trackSessionStart(targetUser.id, selectedStore.store_id)
        }

        console.log(`✅ AuthProvider: User has access to ${permissionResult.stores.length} stores`)
      } else {
        // 失敗時: 既に true (権限あり) と確定していた場合は上書きしない
        // 一時的なネットワーク失敗 / Edge Function 失敗 で UnauthorizedPage に
        // 飛ばすのを防ぐ。次回の checkUserPermissions で再判定する機会を残す。
        setPermissionState(prev => {
          if (prev.hasStorePermission === true) {
            console.warn('⚠️ AuthProvider: Permission check failed but keeping previous true state', { error: permissionResult.error, source })
            return { ...prev, loading: false, error: permissionResult.error, lastChecked: now }
          }
          return {
            hasStorePermission: false,
            loading: false,
            error: permissionResult.error,
            lastChecked: now
          }
        })
        // userStores 等は前回値を保持 (権限が true → false の急変を防ぐ)
        console.log('❌ AuthProvider: User does not have store permission (or transient failure)')
      }
    } catch (error) {
      console.error('❌ AuthProvider: Error checking permissions:', error)
      // 例外時も既存 true は維持
      setPermissionState(prev => {
        if (prev.hasStorePermission === true) {
          return { ...prev, loading: false, error: error.message, lastChecked: now }
        }
        return {
          hasStorePermission: false,
          loading: false,
          error: error.message,
          lastChecked: now
        }
      })
    } finally {
      permissionCheckRef.current.isChecking = false
    }
  }
  
  // 認証状態の初期化
  useEffect(() => {
    // === DEV バイパス: 認証を全部スキップして fake user/store を流し込む ===
    if (DEV_AUTH_BYPASS) {
      console.warn('⚠️ [DEV] AUTH BYPASS 有効: 認証をスキップしています (本番では絶対に動きません)')
      setUser(DEV_FAKE_USER)
      setSession({ user: DEV_FAKE_USER, access_token: 'dev-bypass' })
      setUserStores(DEV_FAKE_STORES)
      setCurrentStore(DEV_FAKE_STORE)
      setStoreInfo(DEV_FAKE_STORE)
      setPermissionState({
        hasStorePermission: true,
        loading: false,
        error: null,
        lastChecked: Date.now()
      })
      setPartnerTheme(null)
      setPartnerThemeLoaded(true)
      setLoading(false)
      setIsInitialized(true)
      return
    }

    console.log('🔄 AuthProvider: Starting initialization...')

    let isMounted = true

    const initializeAuth = async () => {
      try {
        console.log('🔍 AuthProvider: Getting current session...')
        // Supabase の getSession が refresh_token rotation で応答しない事故対策
        // 8 秒で諦めて未ログイン扱い (ユーザーがロード画面で固まらないように)
        const initialSession = await Promise.race([
          getCurrentSession(),
          new Promise((resolve) => setTimeout(() => {
            console.warn('⚠️ AuthProvider: getCurrentSession timed out after 8s, treating as no session')
            resolve(null)
          }, 8000))
        ])
        console.log('🔍 AuthProvider: Initial session result:', {
          hasSession: !!initialSession,
          hasUser: !!initialSession?.user,
          userId: initialSession?.user?.id
        })

        if (!isMounted) {
          console.log('🔄 AuthProvider: Component unmounted during initialization')
          return
        }

        // セッション状態を更新
        setSession(initialSession)
        setUser(initialSession?.user || null)
        console.log('✅ AuthProvider: Session state updated')

        if (initialSession?.user) {
          console.log('🔍 AuthProvider: User found, checking permissions...')
          await checkUserPermissions(initialSession.user, 'initialization')
        } else {
          console.log('🔍 AuthProvider: No user, setting permission state to false')
          setPermissionState({
            hasStorePermission: false,
            loading: false,
            error: null,
            lastChecked: Date.now()
          })
        }
      } catch (error) {
        console.error('❌ AuthProvider: Error during initialization:', error)
        if (isMounted) {
          setSession(null)
          setUser(null)
          setPermissionState({
            hasStorePermission: false,
            loading: false,
            error: error.message,
            lastChecked: Date.now()
          })
          setStoreInfo(null)
          setUserStores([])
          setCurrentStore(null)
        }
      } finally {
        if (isMounted) {
          console.log('🔄 AuthProvider: Finalizing initialization...')
          setLoading(false)
          setIsInitialized(true)
          console.log('✅ AuthProvider: Initialization completed successfully')
        }
      }
    }

    initializeAuth()

    return () => {
      console.log('🧹 AuthProvider: Cleanup initialization effect')
      isMounted = false
      
      // デバウンスタイマーをクリア
      if (permissionCheckRef.current.debounceTimer) {
        clearTimeout(permissionCheckRef.current.debounceTimer)
      }
    }
  }, [])

  // AppLifecycleManagerと連携したフォアグラウンド処理（セッション管理対応）
  useEffect(() => {
    if (!isInitialized) return
    // DEV バイパス時はフォアグラウンド復帰時のセッションチェックをスキップ
    if (DEV_AUTH_BYPASS) return

    const handleAppForeground = async () => {
      console.log('🔄 AuthProvider: App returned to foreground')

      // セッションの有効性をチェック
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ AuthProvider: Error getting session on foreground:', error)
          // セッション取得エラー時はログアウト
          await signOut()
          return
        }

        if (!currentSession) {
          console.log('⚠️ AuthProvider: No session found on foreground, logging out')
          await signOut()
          return
        }

        // セッションの有効期限をチェック
        const now = Math.floor(Date.now() / 1000)
        const expiresAt = currentSession.expires_at

        if (expiresAt && expiresAt < now) {
          console.log('⚠️ AuthProvider: Session expired, attempting refresh')

          // セッションリフレッシュを試みる
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

          if (refreshError || !refreshData.session) {
            console.error('❌ AuthProvider: Session refresh failed, logging out', refreshError)
            await signOut()
            return
          }

          console.log('✅ AuthProvider: Session refreshed successfully')
          setSession(refreshData.session)
          setUser(refreshData.session.user)
        } else {
          console.log('✅ AuthProvider: Session is valid')
        }

        // セッションが有効なら 権限+店舗情報を再取得
        // (店舗責任者が変更した staff_view_mode / answer_cooldown_days を
        //  スタッフ側で 即時反映するため - 古いキャッシュ情報を更新)
        const sessionUser = currentSession?.user
        if (sessionUser) {
          await checkUserPermissions(sessionUser, 'foreground-refresh')
        }

      } catch (error) {
        console.error('❌ AuthProvider: Exception during foreground session check:', error)
      }
    }

    const unsubscribeForeground = lifecycle.onForeground(handleAppForeground)
    return () => unsubscribeForeground()
  }, [isInitialized, lifecycle])

  // 60 秒ごとに 権限+店舗情報を re-fetch
  // 店舗責任者の設定変更 (staff_view_mode 等) をスタッフが開きっぱなしの画面でも反映するため
  useEffect(() => {
    if (!isInitialized || !user || DEV_AUTH_BYPASS) return
    const tick = () => {
      // 画面が裏なら無駄打ちしない
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      checkUserPermissions(user, 'periodic-refresh')
    }
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [isInitialized, user?.id])

  // stores テーブルの UPDATE を Supabase Realtime で購読
  // 店舗責任者が staff_view_mode / answer_cooldown_days を変更した瞬間に
  // 同じ店舗のスタッフ画面にも即時反映される (60秒ポーリングを待たない)
  useEffect(() => {
    if (!isInitialized || DEV_AUTH_BYPASS) return
    if (!currentStore?.store_id) return

    const channel = supabase
      .channel(`stores-${currentStore.store_id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stores',
        filter: `id=eq.${currentStore.store_id}`
      }, (payload) => {
        const updated = payload?.new
        if (!updated) return
        console.log('🔄 AuthProvider: stores UPDATE realtime received', updated)
        // 関心のあるカラムだけ部分マージ
        setCurrentStore(prev => prev ? {
          ...prev,
          stores: {
            ...(prev.stores || {}),
            staff_view_mode: updated.staff_view_mode ?? prev.stores?.staff_view_mode,
            answer_cooldown_days: updated.answer_cooldown_days ?? prev.stores?.answer_cooldown_days,
            name: updated.name ?? prev.stores?.name,
          }
        } : prev)
        setStoreInfo(prev => prev ? {
          ...prev,
          stores: {
            ...(prev.stores || {}),
            staff_view_mode: updated.staff_view_mode ?? prev.stores?.staff_view_mode,
            answer_cooldown_days: updated.answer_cooldown_days ?? prev.stores?.answer_cooldown_days,
            name: updated.name ?? prev.stores?.name,
          }
        } : prev)
        setUserStores(prev => prev.map(s =>
          s.store_id === currentStore.store_id
            ? {
                ...s,
                stores: {
                  ...(s.stores || {}),
                  staff_view_mode: updated.staff_view_mode ?? s.stores?.staff_view_mode,
                  answer_cooldown_days: updated.answer_cooldown_days ?? s.stores?.answer_cooldown_days,
                  name: updated.name ?? s.stores?.name,
                }
              }
            : s
        ))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isInitialized, currentStore?.store_id])

  // 認証状態の変更を監視
  useEffect(() => {
    if (!isInitialized) return
    // DEV バイパス時は Supabase の auth listener を張らない (fake state を上書きされないため)
    if (DEV_AUTH_BYPASS) return

    console.log('🔄 AuthProvider: Setting up auth state listener...')
    
    const { data: { subscription } } = onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AuthProvider: Auth state changed:', event)
        console.log('🔍 AuthProvider: New session:', session)
        console.log('🔍 AuthProvider: New user:', session?.user)
        
        setSession(session)
        setUser(session?.user || null)

        // 認証イベントの処理
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ AuthProvider: Processing SIGNED_IN event')
          
          // ユーザープロファイルを保存/更新
          await upsertUserProfile(session.user)
          
          // Google Analyticsにログインを追跡
          trackLogin('line')
          
          // 権限チェック
          await checkUserPermissions(session.user, 'sign-in')
          
        } else if (event === 'SIGNED_OUT') {
          console.log('🔄 AuthProvider: Processing SIGNED_OUT event')
          
          // Google Analyticsにログアウトを追跡
          trackLogout()
          
          // 全ての認証関連状態をクリア
          setPermissionState({
            hasStorePermission: false,
            loading: false,
            error: null,
            lastChecked: Date.now()
          })
          setStoreInfo(null)
          setUserStores([])
          setCurrentStore(null)
          
          // 権限チェック状態もリセット
          permissionCheckRef.current = {
            isChecking: false,
            lastCheckTime: 0,
            debounceTimer: null
          }
          
          console.log('✅ AuthProvider: State cleared after SIGNED_OUT')
          
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 AuthProvider: Processing TOKEN_REFRESHED event')
          // セッション更新時は権限チェックをスキップ（重複回避）
          // フォーカス復帰時の権限チェックに任せる
          
        } else if (event === 'USER_UPDATED' && session?.user) {
          console.log('🔄 AuthProvider: Processing USER_UPDATED event')
          // ユーザー情報更新時はプロファイルを更新
          await upsertUserProfile(session.user)
        }
      }
    )

    return () => {
      console.log('🔄 AuthProvider: Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [isInitialized])

  // ログアウト関数
  const signOut = async () => {
    try {
      console.log('🔄 AuthProvider: Starting signOut...')
      
      // Google Analyticsにログアウトを追跡（状態クリア前に実行）
      trackLogout()
      
      // 競合状態を回避するため、即座に認証状態をクリア
      setUser(null)
      setSession(null)
      setPermissionState({
        hasStorePermission: false,
        loading: false,
        error: null,
        lastChecked: Date.now()
      })
      setStoreInfo(null)
      setUserStores([])
      setCurrentStore(null)
      
      // ローカルストレージもクリア
      localStorage.removeItem('selectedStoreId')
      
      // Supabaseのサインアウトを実行
      await supabaseSignOut()
      
      console.log('✅ AuthProvider: SignOut completed successfully')
      
    } catch (error) {
      console.error('❌ AuthProvider: Error during signOut:', error)
      // エラーが発生してもログインページにリダイレクト
      window.location.href = '/login'
      throw error
    }
  }

  // 手動でのセッション更新
  const refreshSession = async () => {
    try {
      console.log('🔄 AuthProvider: Manually refreshing session...')
      
      // 現在のセッションを取得
      const currentSession = await getCurrentSession()
      
      if (!currentSession) {
        console.log('❌ AuthProvider: No current session found during refresh')
        return false
      }

      // セッションが有効期限内の場合は更新をスキップ
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = currentSession.expires_at
      
      if (expiresAt && (expiresAt - now > 300)) { // 5分以上残っている場合
        console.log('✅ AuthProvider: Session is still valid, skipping refresh')
        return true
      }

      // セッションを更新
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('❌ AuthProvider: Error refreshing session:', error)
        return false
      }
      
      // 新しいセッションデータがある場合は状態を更新
      if (data?.session) {
        setSession(data.session)
        setUser(data.session.user)
        console.log('✅ AuthProvider: Session refreshed successfully')
      }
      
      return true
      
    } catch (error) {
      console.error('❌ AuthProvider: Exception during session refresh:', error)
      return false
    }
  }

  // パートナーテーマを取得
  useEffect(() => {
    // DEV バイパス時は fake store_id では DB に当たらないのでスキップ
    if (DEV_AUTH_BYPASS) return

    const fetchPartnerTheme = async () => {
      setPartnerThemeLoaded(false)
      if (!currentStore?.store_id) {
        setPartnerTheme(null)
        setPartnerThemeLoaded(true)
        return
      }

      try {
        // store_membershipsからcompany_idを取得
        const { data: membership } = await supabase
          .from('store_memberships')
          .select('company_id')
          .eq('store_id', currentStore.store_id)
          .limit(1)
          .maybeSingle()

        if (!membership?.company_id) {
          setPartnerTheme(null)
          setPartnerThemeLoaded(true)
          return
        }

        const { data: theme, error } = await supabase
          .rpc('get_partner_theme', { p_company_id: membership.company_id })

        if (error || !theme) {
          setPartnerTheme(null)
          setPartnerThemeLoaded(true)
          return
        }

        console.log('✅ AuthProvider: Partner theme loaded:', theme)
        setPartnerTheme(theme)
      } catch (err) {
        console.error('❌ AuthProvider: Partner theme fetch error:', err)
        setPartnerTheme(null)
      } finally {
        setPartnerThemeLoaded(true)
      }
    }

    fetchPartnerTheme()
  }, [currentStore?.store_id])

  // currentStore の stores サブオブジェクトを部分更新する
  // (店舗責任者が staff_view_mode などを保存した直後に Edge Function の戻り値で
  //  即時反映するために使う。AuthContext の再フェッチを待たない)
  const updateCurrentStoreSettings = useCallback((updates) => {
    if (!updates) return
    setCurrentStore(prev => {
      if (!prev) return prev
      return { ...prev, stores: { ...(prev.stores || {}), ...updates } }
    })
    setStoreInfo(prev => {
      if (!prev) return prev
      return { ...prev, stores: { ...(prev.stores || {}), ...updates } }
    })
    setUserStores(prev => prev.map(s =>
      s.store_id && currentStore?.store_id && s.store_id === currentStore.store_id
        ? { ...s, stores: { ...(s.stores || {}), ...updates } }
        : s
    ))
  }, [currentStore?.store_id])

  // 店舗選択関数
  const selectStore = (storeId) => {
    console.log('🔄 AuthProvider: Selecting store:', storeId)
    
    const selectedStore = userStores.find(store => store.store_id === storeId)
    if (selectedStore) {
      setCurrentStore(selectedStore)
      setStoreInfo(selectedStore) // 後方互換性のため
      
      // 選択を永続化
      localStorage.setItem('selectedStoreId', storeId)
      
      console.log('✅ AuthProvider: Store selected:', selectedStore.stores?.name || storeId)
    } else {
      console.error('❌ AuthProvider: Store not found:', storeId)
    }
  }

  const value = {
    user,
    session,
    loading,
    isInitialized,
    signOut,
    refreshSession,
    checkUserPermissions: () => user ? checkUserPermissions(user, 'manual') : Promise.resolve(),
    
    // 権限状態
    hasStorePermission: permissionState.hasStorePermission,
    permissionLoading: permissionState.loading,
    permissionError: permissionState.error,
    
    // 店舗情報（後方互換性のため保持）
    storeInfo,
    userStores,
    currentStore,
    updateCurrentStoreSettings,
    selectStore,

    // パートナーテーマ
    partnerTheme,
    partnerThemeLoaded
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}