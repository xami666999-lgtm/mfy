import './preview-mock'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import './nuvio-clean.css'
import './nuvio-home.css'
import './phone.css'
import './theme-packs.css'
import { bootPack } from './components/ThemePicker'

bootPack()

if (!/Electron/i.test(navigator.userAgent) && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
