import React from 'react'
import { type LucideIcon } from 'lucide-react'
import { Button } from '../ui/Button'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto gap-4 ${className}`}>
      {Icon && (
        <div className="p-4 bg-brand-darkSurface border border-brand-lightText/10 text-brand-lightText/40 rounded-2xl flex items-center justify-center shadow-glass-light">
          <Icon className="h-10 w-10 text-brand-secondary" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-bold text-brand-lightText">{title}</h3>
        <p className="text-sm text-brand-lightText/60 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
