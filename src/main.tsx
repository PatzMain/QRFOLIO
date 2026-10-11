import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Import early so the module-level beforeinstallprompt listener is registered
// before React mounts — prevents the install prompt event from being missed.
import './shared/hooks/useInstallPrompt'
import { App } from './app/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
