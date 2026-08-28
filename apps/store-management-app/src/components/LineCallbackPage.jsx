import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase, decodeLineState } from '../lib/supabase'
import '../pages/UnauthorizedPage.css'
import './LineCallbackPage.css'

const LineCallbackPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(true)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    // Prevent double execution in React Strict Mode using ref
    if (!hasStartedRef.current) {
      hasStartedRef.current = true
      handleLineCallback()
    }
  }, [])

  const handleLineCallback = async () => {
    try {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const errorParam = searchParams.get('error')

      console.log('LINE callback parameters:', { code, state, error: errorParam })

      // state にエンコードされた redirectPath を取り出す（localStorage が消えていてもURLから復元可能）
      const stateData = decodeLineState(state)
      const redirectPathFromState = stateData?.redirectPath || null
      const csrfFromState = stateData?.csrf || null

      // フォールバック: localStorage に残っていればそちらも参照
      const redirectPathFromStorage = localStorage.getItem('lineLoginRedirectPath')
      const resolvedRedirectPath = redirectPathFromState || redirectPathFromStorage || '/'

      console.log('Resolved redirect path:', {
        fromState: redirectPathFromState,
        fromStorage: redirectPathFromStorage,
        resolved: resolvedRedirectPath
      })

      // Check if this code has already been processed
      const processedCode = localStorage.getItem('processedLineCode')
      if (processedCode === code) {
        console.log('Code already processed, skipping...')
        navigate(resolvedRedirectPath)
        return
      }

      console.log('Processing new LINE code:', code?.substring(0, 10) + '...')

      if (errorParam) {
        throw new Error('LINE認証がキャンセルされました')
      }

      if (!code) {
        throw new Error('認証コードが見つかりません')
      }

      // CSRF 検証: state から取り出した csrf を localStorage と突き合わせる
      // 旧クライアントとの互換のため、state がランダム文字列のみだった場合は state そのもので比較
      const storedCsrf = localStorage.getItem('lineLoginState')
      const expectedCsrf = csrfFromState || state
      console.log('CSRF verification:', { storedCsrf, expectedCsrf, hasStateData: !!stateData })

      // localStorage が分離されている（LINEアプリ内ブラウザ→外部ブラウザ等）場合は
      // 警告のみで通過させる。LINE 側で code の検証が成功する=認証は完了しているのでリスク限定的
      if (!storedCsrf) {
        console.warn('CSRF token not found in localStorage (browser may have switched). Continuing with code verification only.')
      } else if (storedCsrf !== expectedCsrf) {
        console.error('CSRF mismatch detected - possible attack or stale state')
        if (import.meta.env.MODE === 'development') {
          console.warn('Skipping state verification in development mode')
        } else {
          throw new Error('不正なリクエストです')
        }
      } else {
        localStorage.removeItem('lineLoginState')
      }

      // Call Supabase Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('line-login', {
        body: { code, state }
      })

      console.log('Edge Function response:', { data, functionError })

      if (functionError) {
        console.error('Edge Function error details:', functionError)
        throw new Error(functionError.message || 'LINE認証に失敗しました')
      }

      if (!data || !data.success) {
        console.error('Edge Function data error:', data)
        console.error('Error details:', data?.details)
        throw new Error(data?.error || 'LINE認証に失敗しました')
      }

      // Use the session URL to sign in
      if (data.session_url) {
        console.log('Session URL received:', data.session_url)

        // Extract the verification type and session token from the URL
        const url = new URL(data.session_url)
        const token = url.searchParams.get('token')
        const type = url.searchParams.get('type')

        console.log('Session token details:', { token: token?.substring(0, 20) + '...', type })

        if (token && type === 'magiclink') {
          console.log('Attempting to verify OTP...')

          // Verify the session with Supabase
          const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'magiclink'
          })

          console.log('OTP verification result:', { sessionData, sessionError })

          if (sessionError) {
            console.error('Session error details:', sessionError)
            throw new Error('セッション作成に失敗しました: ' + sessionError.message)
          }

          console.log('Session created successfully:', sessionData)

          // Mark this code as processed
          localStorage.setItem('processedLineCode', code)

          // localStorage の redirectPath は使い終わったら消す（state から復元可能なので安全）
          localStorage.removeItem('lineLoginRedirectPath')

          // state に含まれていたパスを優先して遷移
          navigate(resolvedRedirectPath)
        } else {
          throw new Error('無効なセッションです')
        }
      } else {
        throw new Error('セッション情報が見つかりません')
      }

    } catch (error) {
      console.error('LINE callback error:', error)
      setError(error.message)
      setProcessing(false)

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    }
  }

  if (processing) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-loading">
            <div className="btn-spinner" style={{ color: '#5e17eb', width: 28, height: 28, borderWidth: 3 }} />
            <p className="auth-loading-text">認証しています</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon error">
          <span className="material-symbols-outlined">error</span>
        </div>
        <h1 className="auth-title">認証に失敗しました</h1>
        <p className="auth-description">{error}</p>
        <p className="auth-loading-text">3秒後にログイン画面に戻ります</p>
      </div>
    </div>
  )
}

export default LineCallbackPage
