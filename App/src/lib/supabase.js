import { createClient } from '@supabase/supabase-js'

// Supabase設定
// 環境変数の取得と検証
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// 環境変数の存在確認
if (!supabaseUrl) {
  throw new Error('環境変数 REACT_APP_SUPABASE_URL が設定されていません。.env.local ファイルを確認してください。');
}

if (!supabaseAnonKey) {
  throw new Error('環境変数 REACT_APP_SUPABASE_ANON_KEY が設定されていません。.env.local ファイルを確認してください。');
}

// APIキーの基本的なフォーマット検証
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  throw new Error('無効な Supabase URL フォーマットです');
}

if (!supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.length < 100) {
  throw new Error('無効な Supabase Anon Key フォーマットです');
}

// モバイルブラウザの検出
const isMobile = typeof window !== 'undefined' && 
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // モバイル固有の設定
    flowType: isMobile ? 'pkce' : 'implicit',
    // モバイルでのセッション持続性を向上
    storage: typeof window !== 'undefined' ? {
      getItem: (key) => {
        if (typeof localStorage === 'undefined') return null;
        return localStorage.getItem(key);
      },
      setItem: (key, value) => {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        if (typeof localStorage === 'undefined') return;
        localStorage.removeItem(key);
      },
    } : undefined
  },
  // モバイルでのネットワーク接続を改善
  global: {
    headers: {
      'X-Client-Info': isMobile ? 'mobile-browser' : 'desktop-browser'
    }
  }
})

// 認証状態の確認
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

// セッション情報の取得
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  return session
}