import React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'other'
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'primary',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider'
  
  const variants = {
    primary: 'bg-brand-primary/20 text-brand-secondary border border-brand-primary/30',
    secondary: 'bg-brand-darkSurface border border-brand-lightText/10 text-brand-lightText/80',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    other: 'bg-brand-lightText/10 text-brand-lightText/70 border border-brand-lightText/20'
  }

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
