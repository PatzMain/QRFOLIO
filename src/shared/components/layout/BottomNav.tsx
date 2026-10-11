import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Folder, Settings } from 'lucide-react'

export const BottomNav: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/categories', label: 'Categories', icon: Folder },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-brand-darkBg/80 backdrop-blur-lg border-t border-brand-lightText/10 safe-bottom lg:hidden">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          const Icon = tab.icon
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center w-full h-full min-h-[48px] min-w-[48px] gap-1 transition-colors select-none outline-none"
              style={{ touchAction: 'manipulation' }}
            >
              <Icon
                className={`h-5 w-5 transition-transform duration-200 active:scale-95 ${
                  active ? 'text-brand-primary stroke-[2.5px]' : 'text-brand-lightText/40'
                }`}
              />
              <span
                className={`text-[10px] font-bold tracking-wide uppercase transition-colors ${
                  active ? 'text-brand-primary' : 'text-brand-lightText/40'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
