import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(18, 18, 26, 0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: 'white',
          borderRadius: '12px',
          padding: '14px 18px',
        },
        success: {
          iconTheme: {
            primary: '#FF1493',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#FF1493',
            secondary: 'white',
          },
        },
      }}
    />
  </React.StrictMode>,
)