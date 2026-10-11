import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { DesktopHeader } from './DesktopHeader'
import { AppLogo } from '../ui/AppLogo'

export interface HeaderProps {
  title: string
  showBackButton?: boolean
  onBack?: () => void
  rightAction?: React.ReactNode
  showLogo?: boolean
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBack,
  rightAction,
  showLogo = false,
}) => {
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { isInstallable, installApp } = useInstallPrompt()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  if (isDesktop) {
    return (
      <DesktopHeader
        title={title}
        showBackButton={showBackButton}
        onBack={onBack}
        rightAction={rightAction}
      />
    )
  }

  return (
    <header className="sticky top-0 left-0 right-0 z-30 bg-brand-darkBg/60 backdrop-blur-md border-b border-brand-lightText/10 safe-top w-full">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto gap-4">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <IconButton
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="h-5 w-5" />}
              onClick={handleBack}
              aria-label="Go back"
            />
          )}
          {showLogo ? (
            <AppLogo size="md" />
          ) : (
            <h1 className="text-lg font-bold text-brand-lightText tracking-tight truncate max-w-[200px] !my-0">
              {title}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={async () => { await installApp() }}
              className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-brand-primary/15 text-brand-primary hover:bg-brand-primary/25 transition-colors duration-200 active:scale-95"
              aria-label="Install app"
            >
              <Download className="h-4 w-4" />
              {/* Attention dot */}
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand-primary shadow-lg shadow-brand-primary/40 animate-pulse" />
            </button>
          )}
          {rightAction}
        </div>
      </div>
    </header>
  )
}

