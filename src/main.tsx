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

// Debug: affiche les infos de chargement pendant 3s
const dbg = document.createElement('div')
dbg.id = 'debug-overlay'
dbg.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#1D3462;color:#fff;padding:12px;font-size:11px;font-family:monospace;z-index:9999'
dbg.textContent = `SCAPP boot | proto:${window.location.protocol} | url:${import.meta.env.VITE_SUPABASE_URL ? 'OK' : 'MISSING'} | key:${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'OK' : 'MISSING'}`
document.body.appendChild(dbg)
setTimeout(() => dbg.remove(), 5000)

// Apply persisted dark mode class before first render
try {
  const stored = JSON.parse(localStorage.getItem('sc-auth') || '{}')
  if (stored?.state?.isDark) document.documentElement.classList.add('dark')
} catch {}

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message + '\n' + e.stack : String(e)
  document.body.innerHTML = `<pre style="color:red;padding:20px;font-size:12px;white-space:pre-wrap">${msg}</pre>`
}
