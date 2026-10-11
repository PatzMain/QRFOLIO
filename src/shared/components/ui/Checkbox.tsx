import React from 'react'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Checkbox: React.FC<CheckboxProps> = ({
  className = '',
  label,
  error,
  id,
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      <label className="flex items-center gap-3 cursor-pointer select-none text-sm font-medium text-brand-lightText/85">
        <input
          id={id}
          type="checkbox"
          className="sr-only peer"
          {...props}
        />
        <div className="w-5 h-5 bg-brand-darkBg/60 border border-brand-lightText/10 rounded-md flex items-center justify-center peer peer-focus:ring-2 peer-focus:ring-brand-primary/30 peer-checked:bg-brand-primary peer-checked:border-brand-primary transition-all">
          <svg className="w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform duration-150" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        {label && <span>{label}</span>}
      </label>
      {error && (
        <span className="text-xs text-red-500 px-1 font-medium">{error}</span>
      )}
    </div>
  )
}
