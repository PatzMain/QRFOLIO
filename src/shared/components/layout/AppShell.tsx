import React, { useState, useEffect } from 'react'
import { BottomNav } from './BottomNav'
import { useOfflineStatus } from '../../hooks/useOfflineStatus'
import { WifiOff, Wifi } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { SidebarNav } from './SidebarNav'
import { useUpdatePrompt } from '../../hooks/useUpdatePrompt'
import { UpdateBanner } from '../feedback/UpdateBanner'

export interface AppShellProps {
  children: React.ReactNode
  header?: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children, header }) => {
  const { isOffline } = useOfflineStatus()
  const [showBanner, setShowBanner] = useState(false)
  const [bannerType, setBannerType] = useState<'offline' | 'online' | null>(null)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { needRefresh, updateServiceWorker } = useUpdatePrompt()

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    
    // Defer state updates to next tick to avoid synchronous cascading renders
    const deferTimer = setTimeout(() => {
      if (isOffline) {
        setBannerType('offline')
        setShowBanner(true)
        // Hide the banner after 4 seconds
        timer = setTimeout(() => {
          setShowBanner(false)
        }, 4000)
      } else {
        // If we were offline and now we are online, show a green connection banner
        if (bannerType === 'offline') {
          setBannerType('online')
          setShowBanner(true)
          timer = setTimeout(() => {
            setShowBanner(false)
          }, 3000)
        } else {
          setShowBanner(false)
        }
      }
    }, 0)

    return () => {
      clearTimeout(deferTimer)
      if (timer) clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline])

  const banner = (
    <AnimatePresence>
      {showBanner && bannerType && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className={`text-[11px] font-semibold py-1.5 px-4 flex items-center justify-center gap-1.5 shadow-md sticky top-0 z-50 backdrop-blur-sm uppercase tracking-wider overflow-hidden ${
            bannerType === 'offline' 
              ? 'bg-amber-600/95 text-white' 
              : 'bg-emerald-600/95 text-white'
          }`}
        >
          {bannerType === 'offline' ? (
            <>
              <WifiOff className="h-3.5 w-3.5 animate-pulse" />
              Offline Mode — Working from Local Storage
            </>
          ) : (
            <>
              <Wifi className="h-3.5 w-3.5" />
              Connection Restored — Online
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )

  const updateBanner = (
    <UpdateBanner
      needRefresh={needRefresh}
      onUpdate={updateServiceWorker}
    />
  )

  if (isDesktop) {
    return (
      <div className="flex min-h-screen bg-brand-darkBg text-brand-lightText w-full relative overscroll-y-none">
        <SidebarNav />
        <div className="desktop-content-area">
          {banner}
          {updateBanner}
          {header}
          <main className="flex-1 w-full flex flex-col">
            {children}
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-darkBg text-brand-lightText w-full max-w-lg mx-auto border-x border-brand-lightText/5 pb-[calc(5rem+env(safe-area-inset-bottom))] relative overscroll-y-none">
      {banner}
      {updateBanner}
      {header}
      <main className="flex-1 w-full flex flex-col p-4 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

