import React from 'react'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  className?: string
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className = '',
}) => {
  return (
    <label className={`flex items-center justify-between gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      {label && (
        <span className="text-sm font-medium text-brand-lightText/85">{label}</span>
      )}
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-10 h-6 bg-brand-darkBg border border-brand-lightText/10 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-primary/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-brand-lightText/40 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary peer-checked:after:bg-white peer-checked:after:border-none" />
      </div>
    </label>
  )
}
