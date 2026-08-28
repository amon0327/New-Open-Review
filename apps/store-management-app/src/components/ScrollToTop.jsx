import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const ScrollToTop = () => {
  const { pathname, search } = useLocation()

  useEffect(() => {
    // 即座にスクロールリセット
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      })
      // document.documentElementとdocument.bodyも確実にリセット
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    // 複数回実行して確実にリセット
    scrollToTop()
    
    // ブラウザの描画後にも実行
    requestAnimationFrame(() => {
      scrollToTop()
    })
    
    // さらに遅延実行でも確実にリセット
    const timeoutId = setTimeout(() => {
      scrollToTop()
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [pathname, search])

  return null
}

export default ScrollToTop