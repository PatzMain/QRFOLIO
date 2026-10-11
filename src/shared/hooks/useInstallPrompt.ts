import { useState, useEffect } from 'react'

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

// ─── Module-level singleton ────────────────────────────────────────────────
// Capture the event IMMEDIATELY at module load — before React mounts.
// This ensures we never miss the beforeinstallprompt event even if it fires
// during or before the first render cycle.
let _deferredPrompt: BeforeInstallPromptEvent | null = null
let _installInProgress = false
const _subscribers = new Set<(e: BeforeInstallPromptEvent | null) => void>()

const notify = (e: BeforeInstallPromptEvent | null) => {
  _deferredPrompt = e
  _subscribers.forEach((fn) => fn(e))
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  if (standalone) { notify(null); return }
  notify(e as BeforeInstallPromptEvent)
})

window.addEventListener('appinstalled', () => {
  notify(null)
})
// ──────────────────────────────────────────────────────────────────────────

export const useInstallPrompt = () => {
  // Initialise from the already-captured prompt (handles the race condition
  // where the event fired before this hook first mounted).
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => _deferredPrompt
  )

  useEffect(() => {
    // Subscribe so future firings (e.g. after dismissal) update state too
    const handler = (e: BeforeInstallPromptEvent | null) => setDeferredPrompt(e)
    _subscribers.add(handler)
    return () => { _subscribers.delete(handler) }
  }, [])

  const installApp = async () => {
    // An install event can prompt only once. Consume the captured event before
    // awaiting the browser so double clicks and a dismissal cannot reuse it.
    const prompt = _deferredPrompt
    if (!prompt || _installInProgress) return false
    _installInProgress = true
    notify(null)

    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice

      if (outcome === 'accepted') {
        return true
      }
    } catch (err) {
      console.error('Failed to trigger PWA installation:', err)
    } finally {
      _installInProgress = false
    }
    return false
  }

  return { isInstallable: deferredPrompt !== null, installApp }
}
