import React, { useEffect, useId, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from './Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const focusableSelector = 'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    const firstControl = dialogRef.current?.querySelector<HTMLElement>(focusableSelector)
    ;(firstControl || dialogRef.current)?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-darkBg/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Dialog'}
            tabIndex={-1}
            onKeyDown={(event) => {
              if (event.key === 'Escape') { event.stopPropagation(); onClose() }
              if (event.key !== 'Tab') return
              const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) || [])
              const first = controls[0]
              const last = controls[controls.length - 1]
              if (!first) { event.preventDefault(); dialogRef.current?.focus() }
              else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus() }
              else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
            }}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-brand-lightText/10 bg-brand-darkSurface/90 p-6 shadow-xl backdrop-blur-md z-10 flex flex-col gap-4 max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-brand-lightText/10">
              {title && (
                <h3 id={titleId} className="text-lg font-bold text-brand-lightText">
                  {title}
                </h3>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="!p-1.5 !rounded-lg ml-auto hover:bg-brand-lightText/10"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto pr-1 flex-1 py-1">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-lightText/10">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
