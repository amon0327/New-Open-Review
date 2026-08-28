import liff from '@line/liff';

// LIFF詳細デバッグ情報を取得
export const getLiffDebugInfo = async () => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    url: {
      current: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    },
    liff: {
      initialized: false,
      ready: false,
      _ready: false,
      id: null,
      version: null,
      isInClient: false,
      isLoggedIn: false,
      os: null,
      language: null,
      lineVersion: null
    },
    auth: {
      hasAccessToken: false,
      hasIdToken: false,
      accessToken: null,
      idToken: null
    },
    context: null,
    profile: null,
    errors: []
  };

  try {
    // LIFF基本情報
    debugInfo.liff.initialized = typeof liff !== 'undefined';
    debugInfo.liff.ready = liff.ready || false;
    debugInfo.liff._ready = liff._ready || false;
    debugInfo.liff.id = liff.id || null;
    
    if (liff._ready) {
      debugInfo.liff.version = liff.getVersion();
      debugInfo.liff.isInClient = liff.isInClient();
      debugInfo.liff.isLoggedIn = liff.isLoggedIn();
      debugInfo.liff.os = liff.getOS();
      debugInfo.liff.language = liff.getLanguage();
      
      try {
        debugInfo.liff.lineVersion = liff.getLineVersion();
      } catch (e) {
        debugInfo.errors.push(`getLineVersion error: ${e.message}`);
      }
      
      // 認証情報
      try {
        const accessToken = liff.getAccessToken();
        debugInfo.auth.hasAccessToken = !!accessToken;
        debugInfo.auth.accessToken = accessToken ? 'EXISTS' : null;
      } catch (e) {
        debugInfo.errors.push(`getAccessToken error: ${e.message}`);
      }
      
      try {
        const idToken = liff.getIDToken();
        debugInfo.auth.hasIdToken = !!idToken;
        debugInfo.auth.idToken = idToken ? 'EXISTS' : null;
      } catch (e) {
        debugInfo.errors.push(`getIDToken error: ${e.message}`);
      }
      
      // コンテキスト情報
      try {
        debugInfo.context = liff.getContext();
      } catch (e) {
        debugInfo.errors.push(`getContext error: ${e.message}`);
      }
      
      // プロファイル情報
      if (debugInfo.liff.isLoggedIn) {
        try {
          const profile = await liff.getProfile();
          debugInfo.profile = {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl ? 'EXISTS' : null,
            statusMessage: profile.statusMessage || null
          };
        } catch (e) {
          debugInfo.errors.push(`getProfile error: ${e.message}`);
        }
      }
    }
  } catch (e) {
    debugInfo.errors.push(`General error: ${e.message}`);
  }
  
  return debugInfo;
};

// デバッグ情報をコンソールに出力
export const logLiffDebugInfo = async () => {
  const info = await getLiffDebugInfo();
  console.log('=== LIFF Debug Information ===');
  console.log(JSON.stringify(info, null, 2));
  return info;
};