import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from '../shared/components/feedback/ErrorBoundary'
import { DatabaseProvider } from './providers/DatabaseProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { ToastProvider } from '../shared/components/ui/Toast'
import { AppRouter } from './Router'

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <DatabaseProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </ToastProvider>
        </DatabaseProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
