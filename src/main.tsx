import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Auto-reload when a new service worker takes over (new deployment)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

// Apply persisted dark mode class before first render
try {
  const stored = JSON.parse(localStorage.getItem('sc-auth') || '{}')
  if (stored?.state?.isDark) document.documentElement.classList.add('dark')
} catch {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
