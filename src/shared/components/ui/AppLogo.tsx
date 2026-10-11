import React from 'react'

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg'
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-base tracking-tight',
    md: 'text-xl tracking-tight',
    lg: 'text-2xl tracking-tighter',
  }

  return (
    <div className={`font-sans font-black select-none flex items-center ${sizeClasses[size]}`}>
      <span className="text-brand-primary">QR</span>
      <span className="text-brand-lightText font-semibold ml-0.5">Folio</span>
    </div>
  )
}

export default AppLogo
