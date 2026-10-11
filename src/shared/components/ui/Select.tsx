import React from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
}

export const Select: React.FC<SelectProps> = ({
  className = '',
  label,
  options,
  error,
  id,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...props
}) => {
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
      <div className="relative">
        <select
          id={controlId}
          className={`glass-input w-full appearance-none pr-10 cursor-pointer ${error ? 'border-red-500/50' : ''} ${className}`}
          {...props}
          aria-invalid={error ? true : invalid}
          aria-describedby={[describedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-brand-darkSurface text-brand-lightText">
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-lightText/40">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      {error && (
        <span id={errorId} role="alert" className="text-xs text-red-500 px-1 font-medium">{error}</span>
      )}
    </div>
  )
}
