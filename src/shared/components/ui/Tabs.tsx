import React from 'react'

export interface TabOption {
  value: string
  label: string
  icon?: React.ReactNode
}

export interface TabsProps {
  options: TabOption[]
  selectedValue: string
  onChange: (value: string) => void
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  options,
  selectedValue,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex gap-1 bg-brand-darkBg/60 border border-brand-lightText/10 p-1 rounded-xl overflow-x-auto no-scrollbar scroll-smooth ${className}`}>
      {options.map((option) => {
        const isActive = option.value === selectedValue
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all select-none whitespace-nowrap outline-none focus:ring-1 focus:ring-brand-primary/30
              ${isActive ? 'glass-tab-active' : 'glass-tab-inactive'}`}
          >
            {option.icon && <span className="h-3.5 w-3.5 flex items-center justify-center">{option.icon}</span>}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
