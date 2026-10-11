/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'warning' | 'error' | 'info'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration }])

    if (duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, duration)
    }
  }, [hideToast])

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`flex items-center gap-3 p-4 rounded-xl border pointer-events-auto shadow-lg backdrop-blur-md bg-brand-darkSurface/90 border-brand-lightText/10 w-full`}
            >
              <div className="flex-shrink-0">
                {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                {toast.type === 'info' && <Info className="h-5 w-5 text-brand-secondary" />}
              </div>
              <p className="text-sm font-medium text-brand-lightText flex-1 leading-snug">
                {toast.message}
              </p>
              <button
                onClick={() => hideToast(toast.id)}
                className="flex-shrink-0 text-brand-lightText/40 hover:text-brand-lightText transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
