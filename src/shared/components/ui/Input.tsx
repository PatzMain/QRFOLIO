import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className = '',
  label,
  error,
  leftIcon,
  rightIcon,
  id,
  type = 'text',
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...props
}, ref) => {
  const generatedId = React.useId()
  const controlId = id ?? generatedId
  const errorId = `${controlId}-error`
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={controlId} className="text-xs font-semibold text-brand-lightText/60 px-1 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-brand-lightText/40 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={controlId}
          type={type}
          className={`glass-input w-full ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${error ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30' : ''} ${className}`}
          {...props}
          aria-invalid={error ? true : invalid}
          aria-describedby={[describedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined}
        />
        {rightIcon && (
          <div className="absolute right-3 text-brand-lightText/40 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <span id={errorId} role="alert" className="text-xs text-red-500 px-1 font-medium">{error}</span>
      )}
    </div>
  )
})

Input.displayName = 'Input'
