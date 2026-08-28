import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import WelcomePage from './WelcomePage';
import LiffEntryPage from './LiffEntryPage';
import { isInLineApp } from '../lib/liff';
import { extractStoreCodeFromLiffUrl } from '../utils/liffUrlHelper';

/**
 * ルートパス(/)でのアクセスを処理するコンポーネント
 * - 通常のreviewFormIdパラメータがある場合 → WelcomePage
 * - LINEアプリ内でstoreCodeがある場合 → LiffEntryPage
 */
const LiffRootHandler = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log('=== LiffRootHandler Debug Info ===');
    console.log('Is in LINE app:', isInLineApp());
    console.log('Current URL:', window.location.href);
    console.log('Search params:', Array.from(searchParams.entries()));
  }, [searchParams]);

  // reviewFormIdが直接指定されている場合
  const reviewFormId = searchParams.get('reviewFormId');
  if (reviewFormId) {
    console.log('Found reviewFormId in LiffRootHandler:', reviewFormId);
    console.log('Is in LINE app:', isInLineApp());
    // LINEアプリ内の場合でもWelcomePageを直接表示
    return <WelcomePage />;
  }

  // LINEアプリ内でstoreCodeパラメータがある場合の処理
  if (isInLineApp()) {
    const storeCode = extractStoreCodeFromLiffUrl(
      window.location.pathname,
      searchParams,
      window.location
    );

    if (storeCode || searchParams.has('storeCode') || searchParams.has('store_code') || searchParams.has('liff.state')) {
      console.log('In LINE app with store code params, delegating to LiffEntryPage');
      return <LiffEntryPage />;
    }
  }

  // それ以外の場合はWelcomePageを表示（エラー処理はWelcomePage内で行う）
  return <WelcomePage />;
};

export default LiffRootHandler;