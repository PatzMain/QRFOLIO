import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  pressable?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  pressable = false,
  ...props
}) => {
  return (
    <div
      className={`glass-card p-4 transition-all duration-200 
        ${hoverable ? 'glass-card-hover cursor-pointer' : ''} 
        ${pressable ? 'active:scale-[0.99] cursor-pointer' : ''} 
        ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
