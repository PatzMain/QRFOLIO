import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, X, Sparkles } from 'lucide-react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export interface UpdateBannerProps {
  needRefresh: boolean
  onUpdate: () => void
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({
  needRefresh,
  onUpdate,
}) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [snoozed, setSnoozed] = useState(() => {
    try { return sessionStorage.getItem('pwa-update-snoozed') === 'true' }
    catch { /* Browser storage may be unavailable; keep the update usable. */ }
    return false
  })

  const [prevNeedRefresh, setPrevNeedRefresh] = useState(needRefresh)

  if (needRefresh !== prevNeedRefresh) {
    setPrevNeedRefresh(needRefresh)
    if (!needRefresh) {
      setSnoozed(false)
      try { sessionStorage.removeItem('pwa-update-snoozed') }
      catch { /* Snoozing still works for this mounted banner. */ }
    }
  }

  const handleSnooze = () => {
    setSnoozed(true)
    try { sessionStorage.setItem('pwa-update-snoozed', 'true') }
    catch { /* Retain the in-memory snooze when storage is blocked. */ }
  }

  return (
    <AnimatePresence>
      {needRefresh && !snoozed && (
        <motion.div
          initial={{ opacity: 0, y: isDesktop ? -20 : 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isDesktop ? -20 : 50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed z-50 p-4 glass-card border border-brand-primary/20 shadow-lg shadow-brand-primary/10 flex items-center justify-between gap-4 max-w-lg select-none
            ${isDesktop 
              ? 'top-4 right-4 w-96 left-auto bottom-auto' 
              : 'bottom-20 left-4 right-4 w-auto'
            }
          `}
        >
          <div className="flex items-start gap-3">
            <div className="bg-brand-primary/10 p-2 rounded-xl text-brand-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-lightText">
                Update Available
              </h4>
              <p className="text-[11px] text-brand-lightText/60 leading-normal mt-0.5">
                A new version is ready. Reload to apply the updates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onUpdate}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs shadow-md shadow-brand-primary/10 transition-all duration-200 active:scale-95 outline-none cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
              Update
            </button>
            <button
              onClick={handleSnooze}
              className="p-2 rounded-xl hover:bg-brand-lightText/5 text-brand-lightText/40 hover:text-brand-lightText transition-colors outline-none cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
