import React from 'react'

export interface SkeletonProps {
  className?: string
  circle?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  circle = false,
}) => {
  return (
    <div
      className={`animate-pulse bg-brand-lightText/5 border border-brand-lightText/10 ${circle ? 'rounded-full' : 'rounded-xl'} ${className}`}
    />
  )
}
