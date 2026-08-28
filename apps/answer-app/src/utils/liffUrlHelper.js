/**
 * LIFF URLパラメータ処理のヘルパー関数
 */

/**
 * LIFF URLからstoreCodeを取得する
 * 優先順位: パスパラメータ > 通常のクエリパラメータ > liff.state > ハッシュパラメータ
 * @param {string} pathname - URLパス
 * @param {URLSearchParams} searchParams - URLサーチパラメータ
 * @param {Location} location - window.location
 * @returns {string|null} storeCode
 */
export const extractStoreCodeFromLiffUrl = (pathname, searchParams, location) => {
  console.group('LIFF URL Store Code Extraction');
  console.log('Full URL:', location.href);
  console.log('Pathname:', pathname);
  console.log('Search:', location.search);
  console.log('Hash:', location.hash);
  
  // デバッグ: すべてのsearchParamsエントリを出力
  console.log('All search params:', Array.from(searchParams.entries()));
  
  // reviewFormIdがある場合は早期リターン
  if (searchParams.has('reviewFormId')) {
    console.log('reviewFormId found, skipping store code extraction');
    console.groupEnd();
    return null;
  }

  // 1. パスパラメータから取得
  const pathMatch = pathname.match(/\/liff\/([^/?#]+)/);
  if (pathMatch && pathMatch[1]) {
    console.log('Found store code in path:', pathMatch[1]);
    console.groupEnd();
    return pathMatch[1];
  }

  // 2. 通常のクエリパラメータから取得
  const queryStoreCode = searchParams.get('storeCode') || searchParams.get('store_code');
  if (queryStoreCode) {
    console.log('Found store code in query params:', queryStoreCode);
    console.groupEnd();
    return queryStoreCode;
  }

  // 3. liff.stateパラメータから取得（LIFFの仕様に準拠）
  const liffState = searchParams.get('liff.state');
  if (liffState) {
    try {
      console.log('Found liff.state:', liffState);
      const decodedState = decodeURIComponent(liffState);
      console.log('Decoded liff.state:', decodedState);
      
      // liff.stateには元のクエリパラメータがエンコードされて格納される
      // 形式1: "?storeCode=xxx" または "/?storeCode=xxx"
      const stateMatch = decodedState.match(/[?&]storeCode=([^&]+)/);
      if (stateMatch && stateMatch[1]) {
        console.log('Found store code in liff.state:', stateMatch[1]);
        console.groupEnd();
        return decodeURIComponent(stateMatch[1]);
      }
      
      // 形式2: "store_code"の形式もチェック
      const stateMatch2 = decodedState.match(/[?&]store_code=([^&]+)/);
      if (stateMatch2 && stateMatch2[1]) {
        console.log('Found store_code in liff.state:', stateMatch2[1]);
        console.groupEnd();
        return decodeURIComponent(stateMatch2[1]);
      }
      
      // 形式3: liff.stateがURLSearchParams形式の場合
      try {
        const stateParams = new URLSearchParams(decodedState.replace(/^[/?]+/, ''));
        const storeFromState = stateParams.get('storeCode') || stateParams.get('store_code');
        if (storeFromState) {
          console.log('Found store code in liff.state params:', storeFromState);
          console.groupEnd();
          return storeFromState;
        }
      } catch (e) {
        console.log('liff.state is not in URLSearchParams format');
      }
    } catch (e) {
      console.error('Error decoding liff.state:', e);
    }
  }

  // 4. ハッシュパラメータから取得（フォールバック）
  if (location.hash) {
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const hashStoreCode = hashParams.get('storeCode') || hashParams.get('store_code');
    if (hashStoreCode) {
      console.log('Found store code in hash:', hashStoreCode);
      console.groupEnd();
      return hashStoreCode;
    }
  }

  console.log('No store code found in URL');
  console.groupEnd();
  return null;
};

/**
 * LIFF URL形式を検証する（miniapp.line.meも含む）
 * @param {string} url - 検証するURL
 * @returns {boolean} 有効なLIFF URLかどうか
 */
export const isValidLiffUrl = (url) => {
  const liffUrlPattern = /^https:\/\/(liff\.line\.me|miniapp\.line\.me)\/\d+-[\w]+/;
  return liffUrlPattern.test(url);
};

/**
 * 通常のURLをLIFF URLに変換する
 * @param {string} liffId - LIFF ID
 * @param {string} storeCode - 店舗コード
 * @returns {string} LIFF URL
 */
export const createLiffUrl = (liffId, storeCode) => {
  return `https://liff.line.me/${liffId}?storeCode=${storeCode}`;
};