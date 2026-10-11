import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { useUpdatePrompt } from '../../hooks/useUpdatePrompt'

export interface DesktopHeaderProps {
  title: string
  showBackButton?: boolean
  onBack?: () => void
  rightAction?: React.ReactNode
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  title,
  showBackButton = false,
  onBack,
  rightAction,
}) => {
  const navigate = useNavigate()
  const { needRefresh, updateServiceWorker } = useUpdatePrompt()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header className="h-16 bg-brand-darkBg/60 backdrop-blur-md border-b border-brand-lightText/5 flex items-center justify-between px-6 sticky top-0 z-30 w-full select-none">
      {/* Left side: Back Button & Page Title */}
      <div className="flex items-center gap-3">
        {showBackButton && (
          <IconButton
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="h-5 w-5" />}
            onClick={handleBack}
            aria-label="Go back"
            className="hover:bg-brand-lightText/5"
          />
        )}
        <h1 className="text-xl font-extrabold text-brand-lightText tracking-tight !my-0">
          {title}
        </h1>
      </div>

      {/* Right side: Update Badge & Quick Actions */}
      <div className="flex items-center gap-4">
        {needRefresh && (
          <button
            onClick={updateServiceWorker}
            className="flex items-center gap-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <Sparkles className="h-3.5 w-3.5" />
            Update Available
          </button>
        )}
        
        {rightAction && (
          <div className="flex items-center gap-2">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  )
}
