// グローバルLIFF初期化状態を管理
let liffInitPromise = null;
let liffInitialized = false;

export const getLiffInitPromise = () => liffInitPromise;
export const setLiffInitPromise = (promise) => {
  liffInitPromise = promise;
};

export const isLiffInitialized = () => liffInitialized;
export const setLiffInitialized = (value) => {
  liffInitialized = value;
};

// シングルトンパターンでLIFF初期化を管理
export const initializeLiffOnce = async () => {
  if (liffInitialized) {
    console.log('LIFF already initialized (global flag)');
    return true;
  }

  if (liffInitPromise) {
    console.log('LIFF initialization already in progress, waiting...');
    return await liffInitPromise;
  }

  // 新しい初期化を開始
  const { initializeLiff } = await import('../lib/liff');
  liffInitPromise = initializeLiff().then((result) => {
    if (result) {
      liffInitialized = true;
    }
    return result;
  });

  return await liffInitPromise;
};