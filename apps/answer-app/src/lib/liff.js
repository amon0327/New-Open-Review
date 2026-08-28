import liff from '@line/liff';

// 環境に応じたLIFF IDを取得
const getLiffId = () => {
  const env = process.env.REACT_APP_ENV || 'development';
  let liffId;
  
  switch (env) {
    case 'login':
      liffId = process.env.REACT_APP_LIFF_ID_LOGIN;
      break;
    case 'production':
      liffId = process.env.REACT_APP_LIFF_ID_PROD;
      break;
    case 'review':
      liffId = process.env.REACT_APP_LIFF_ID_REVIEW;
      break;
    default:
      liffId = process.env.REACT_APP_LIFF_ID_DEV;
      break;
  }
  
  
  if (!liffId) {
  }
  
  return liffId;
};

// LIFF初期化
export const initializeLiff = async () => {
  try {
    const liffId = getLiffId();
    
    // LIFF IDが取得できない場合はエラー
    if (!liffId) {
      return false;
    }
    
    
    // URLパラメータを保存
    const urlParams = new URLSearchParams(window.location.search);
    
    // liff.stateパラメータを確認
    const liffState = urlParams.get('liff.state');
    
    // LIFF初期化
    
    try {
      await liff.init({
        liffId: liffId
      });
    } catch (initError) {
      throw initError;
    }
    
    
    // LIFFコンテキストを確認
    if (liff.isInClient()) {
      const context = liff.getContext();
      
      // LIFF URLから追加情報を取得
      if (context && context.liffId) {
      }
      
      // LINEミニアプリ内でのユーザー情報確認
      
      try {
        const accessToken = liff.getAccessToken();
        
        // LINEミニアプリ内では自動ログインは行わない
        // ユーザーは既にLINEにログインしているため、追加の認証は不要
        if (!liff.isLoggedIn()) {
          // liff.login()は呼ばない - 外部サイトへの遷移を避ける
        }
        
        if (accessToken || liff.isLoggedIn()) {
          // プロフィールを取得可能か確認
          try {
            const profile = await liff.getProfile();
          } catch (profileError) {
            // エラーでも処理を続行 - WelcomePageで再度試行する
          }
        }
      } catch (tokenError) {
        // エラーでも処理を続行
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// LINEログイン状態をチェック
export const checkLineLogin = () => {
  if (!liff.isInClient()) {
    return false;
  }
  
  // LINEミニアプリでは自動的にログイン状態になることが多い
  const isLoggedIn = liff.isLoggedIn();
  
  // アクセストークンの存在も確認
  try {
    const accessToken = liff.getAccessToken();
    
    // isLoggedInがfalseでもアクセストークンがある場合は、ログイン済みとみなす
    return isLoggedIn || !!accessToken;
  } catch (e) {
    return isLoggedIn;
  }
};

// LINEログイン
export const lineLogin = () => {
  if (!checkLineLogin()) {
    // redirectUriを指定しない場合、現在のURLにリダイレクトされる
    const currentUrl = window.location.href;
    liff.login();
  }
};

// LINEプロフィールを取得
export const getLineProfile = async () => {
  try {
    // LIFF SDKが初期化されているか確認
    if (!liff._ready) {
      return null;
    }
    
    // アクセストークンの存在を確認
    let hasToken = false;
    try {
      const token = liff.getAccessToken();
      hasToken = !!token;
    } catch (e) {
    }
    
    // プロフィール取得を試みる
    
    const profile = await liff.getProfile();
    
    if (!profile) {
      return null;
    }
    
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage
    };
  } catch (error) {
    
    // エラーの詳細を確認
    if (error.code === 'UNAUTHORIZED') {
    } else if (error.code === 'INIT_FAILED') {
    }
    
    return null;
  }
};

// LINE IDトークンを取得
export const getLineIdToken = () => {
  try {
    const idToken = liff.getIDToken();
    return idToken;
  } catch (error) {
    // IDトークンが取得できない場合は、アクセストークンで代用
    try {
      const accessToken = liff.getAccessToken();
      return accessToken; // IDトークンの代わりにアクセストークンを返す
    } catch (accessError) {
      console.error('Failed to get access token as fallback:', accessError);
      return null;
    }
  }
};

// LIFFの情報を取得
export const getLiffInfo = () => {
  return {
    isInClient: liff.isInClient(),
    isLoggedIn: liff.isLoggedIn(),
    os: liff.getOS(),
    language: liff.getLanguage(),
    version: liff.getVersion(),
    lineVersion: liff.getLineVersion(),
    isApiAvailable: liff.isApiAvailable
  };
};

// LINEアプリ内かどうかをチェック
export const isInLineApp = () => {
  return liff.isInClient();
};

// LIFFウィンドウを閉じる
export const closeLiff = () => {
  liff.closeWindow();
};