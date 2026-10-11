import React from 'react'
import { Button, type ButtonProps } from './Button'

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  className = '',
  size = 'md',
  ...props
}) => {
  const sizes = {
    sm: '!p-1.5 !rounded-lg',
    md: '!p-2.5 !rounded-xl',
    lg: '!p-3.5 !rounded-2xl',
  }

  return (
    <Button
      size={size}
      className={`${sizes[size]} ${className}`}
      {...props}
    >
      {icon}
    </Button>
  )
}
