import { supabase } from '../lib/supabase';

// 認証関連のサービス
export class AuthService {
  // 現在のユーザー情報を取得
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('ユーザー情報取得エラー:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.error('認証状態確認エラー:', error);
      return null;
    }
  }

  // セッション情報を取得
  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('セッション取得エラー:', error);
        return null;
      }
      return session;
    } catch (error) {
      console.error('セッション確認エラー:', error);
      return null;
    }
  }

  // メール・パスワードでサインイン
  static async signInWithEmail(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('サインインエラー:', error);
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('サインイン処理エラー:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  // メール・パスワードでサインアップ
  static async signUpWithEmail(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        console.error('サインアップエラー:', error);
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('サインアップ処理エラー:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  // Googleサインイン
  static async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Googleサインインエラー:', error);
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('Googleサインイン処理エラー:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  // Appleサインイン
  static async signInWithApple() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Appleサインインエラー:', error);
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('Appleサインイン処理エラー:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  // サインアウト
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('サインアウトエラー:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('サインアウト処理エラー:', error);
      return { success: false, error: error.message };
    }
  }

  // パスワードリセット
  static async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('パスワードリセットエラー:', error);
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('パスワードリセット処理エラー:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  // パスワード更新
  static async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('パスワード更新エラー:', error);
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('パスワード更新処理エラー:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  // ユーザー情報更新
  static async updateUserProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        console.error('プロフィール更新エラー:', error);
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('プロフィール更新処理エラー:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  // 認証状態変更の監視
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('認証状態変更:', event, session);
      callback(event, session);
    });
  }

  // ビジネスユーザー情報を取得
  static async getBusinessUser(userId) {
    try {
      const { data, error } = await supabase
        .from('business_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // ユーザーが存在しない場合
          return null;
        }
        console.error('ビジネスユーザー取得エラー:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('ビジネスユーザー取得処理エラー:', error);
      return null;
    }
  }

  // ビジネスユーザー情報を作成・更新
  static async upsertBusinessUser(userId, userData) {
    try {
      const { data, error } = await supabase
        .from('business_users')
        .upsert({
          id: userId,
          ...userData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('ビジネスユーザー更新エラー:', error);
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('ビジネスユーザー更新処理エラー:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  // ユーザーが認証済みかチェック
  static async isAuthenticated() {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // ユーザーのロールや権限をチェック
  static async hasPermission(permission) {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      // ユーザーのメタデータから権限情報を取得
      const userRole = user.user_metadata?.role || user.app_metadata?.role;
      
      // 権限チェックロジック（必要に応じて実装）
      // 例: admin, user, guest など
      return userRole === 'admin' || userRole === 'user';
    } catch (error) {
      console.error('権限チェックエラー:', error);
      return false;
    }
  }
}

export default AuthService;