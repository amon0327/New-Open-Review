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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // セッション永続化を無効化
    detectSessionInUrl: true,
    storage: {
      // セッション管理を手動制御
      getItem: (key) => {
        if (typeof window !== 'undefined') {
          return sessionStorage.getItem(key); // sessionStorageを使用（タブ閉じると削除）
        }
        return null;
      },
      setItem: (key, value) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(key, value);
        }
      },
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(key);
          localStorage.removeItem(key); // 既存のlocalStorageも削除
        }
      }
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