import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Folder, Settings, Plus, Scan, Smartphone } from 'lucide-react'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { AppLogo } from '../ui/AppLogo'

export const SidebarNav: React.FC = () => {
  const { isInstallable, installApp } = useInstallPrompt()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
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
    <aside className="w-64 bg-brand-darkSurface border-r border-brand-lightText/10 flex flex-col h-screen sticky top-0 left-0">
      {/* Logo Area */}
      <div className="p-6 flex items-center select-none border-b border-brand-lightText/5">
        <AppLogo size="lg" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
        {navItems.map((item) => {
          const active = isActive(item.path)
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={active ? 'sidebar-nav-item-active' : 'sidebar-nav-item'}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5px]' : 'text-brand-lightText/40'}`} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Quick Action Buttons */}
      <div className="p-4 border-t border-brand-lightText/5 flex flex-col gap-2">
        <button
          onClick={() => navigate('/generate')}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 transition-all duration-200 active:scale-98 outline-none"
        >
          <Plus className="h-4 w-4" />
          Generate
        </button>
        <button
          onClick={() => navigate('/scan')}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-brand-darkBg hover:bg-brand-darkBg/80 border border-brand-lightText/15 text-brand-lightText font-bold text-sm transition-all duration-200 active:scale-98 outline-none"
        >
          <Scan className="h-4 w-4" />
          Scan QR Code
        </button>

        {/* PWA Install Button — only visible when browser install prompt is available */}
        {isInstallable && (
          <button
            onClick={async () => { await installApp() }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-brand-primary/30 text-brand-primary/90 hover:bg-brand-primary/10 hover:border-brand-primary/50 font-semibold text-xs transition-all duration-200 active:scale-98 outline-none mt-1"
          >
            <Smartphone className="h-3.5 w-3.5" />
            Install App
          </button>
        )}
      </div>
    </aside>
  )
}
export default SidebarNav
