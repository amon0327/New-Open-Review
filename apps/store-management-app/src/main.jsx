import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initializeAppOptimizer } from './utils/appOptimizer'

console.log('Main.jsx loading, DEV mode:', import.meta.env.DEV);

// アプリ最適化システムを初期化
initializeAppOptimizer().catch(error => {
  console.warn('App optimizer initialization failed:', error)
})

// Temporarily disable StrictMode to test for rendering issues
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)