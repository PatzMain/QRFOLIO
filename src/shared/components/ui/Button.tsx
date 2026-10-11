import React from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]'
  
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary/95 shadow-lg shadow-brand-primary/20',
    secondary: 'bg-brand-darkSurface border border-brand-lightText/10 text-brand-lightText hover:bg-brand-lightText/5',
    danger: 'bg-red-600 text-white hover:bg-red-600/90 shadow-lg shadow-red-600/20',
    ghost: 'text-brand-lightText/70 hover:bg-brand-lightText/5 hover:text-brand-lightText',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3.5 rounded-xl gap-2.5',
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
}
