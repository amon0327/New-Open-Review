import ReactGA from 'react-ga4'

// Google Analytics設定ID
const GA_MEASUREMENT_ID = 'G-86G10YKJMF'

// Google Analytics初期化
export const initGA = () => {
  try {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      debug: import.meta.env.DEV, // 開発環境でのみデバッグモード
      testMode: import.meta.env.DEV, // 開発環境でのみテストモード
    })
    console.log('✅ Google Analytics initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing Google Analytics:', error)
  }
}

// ページビュー追跡
export const trackPageView = (page, title) => {
  try {
    ReactGA.send({
      hitType: 'pageview',
      page: page,
      title: title || document.title
    })
    console.log(`📊 GA: Page view tracked - ${page}`)
  } catch (error) {
    console.error('❌ Error tracking page view:', error)
  }
}

// カスタムイベント追跡
export const trackEvent = (eventName, parameters = {}) => {
  try {
    ReactGA.event(eventName, parameters)
    console.log('📊 GA: Event tracked -', eventName, parameters)
  } catch (error) {
    console.error('❌ Error tracking event:', error)
  }
}

// ユーザープロパティ設定
export const setUserProperties = (properties) => {
  try {
    ReactGA.set(properties)
    console.log('👤 GA: User properties set -', properties)
  } catch (error) {
    console.error('❌ Error setting user properties:', error)
  }
}

// 店舗管理アプリ特有のイベント追跡関数

// スコアカードクリック追跡
export const trackScoreCardClick = (scoreType, storeId) => {
  trackEvent('score_card_click', {
    event_category: 'engagement',
    score_type: scoreType,
    store_id: storeId,
    timestamp: new Date().toISOString()
  })
}

// フィルター変更追跡
export const trackFilterChange = (fromFilter, toFilter) => {
  trackEvent('filter_change', {
    event_category: 'interaction',
    filter_from: fromFilter,
    filter_to: toFilter,
    timestamp: new Date().toISOString()
  })
}

// スタッフ詳細ページアクセス追跡
export const trackStaffDetailView = (staffCount, selectedDate) => {
  trackEvent('staff_detail_view', {
    event_category: 'navigation',
    staff_count: staffCount,
    date_selected: selectedDate,
    timestamp: new Date().toISOString()
  })
}

// コメントページアクセス追跡
export const trackCommentPageView = (commentCount, dateFilter) => {
  trackEvent('comment_page_view', {
    event_category: 'engagement',
    comment_count: commentCount,
    date_filter: dateFilter,
    timestamp: new Date().toISOString()
  })
}

// ログイン追跡
export const trackLogin = (loginMethod) => {
  trackEvent('login', {
    event_category: 'authentication',
    method: loginMethod,
    timestamp: new Date().toISOString()
  })
}

// ログアウト追跡
export const trackLogout = () => {
  trackEvent('logout', {
    event_category: 'authentication',
    timestamp: new Date().toISOString()
  })
}

// セッション開始追跡
export const trackSessionStart = (userId, storeId) => {
  trackEvent('session_start', {
    event_category: 'session',
    user_id: userId,
    store_id: storeId,
    timestamp: new Date().toISOString()
  })
  
  // ユーザープロパティも設定
  setUserProperties({
    user_id: userId,
    store_id: storeId,
    app_version: import.meta.env.VITE_APP_VERSION || '1.0.0'
  })
}

// エラー追跡
export const trackError = (errorType, errorMessage, page) => {
  trackEvent('exception', {
    event_category: 'error',
    description: `${errorType}: ${errorMessage}`,
    fatal: false,
    page: page,
    timestamp: new Date().toISOString()
  })
}

// パフォーマンス追跡
export const trackTiming = (category, variable, value, label) => {
  trackEvent('timing_complete', {
    event_category: 'performance',
    name: category,
    value: value,
    custom_parameter_variable: variable,
    custom_parameter_label: label,
    timestamp: new Date().toISOString()
  })
}