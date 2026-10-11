import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertOctagon } from 'lucide-react'
import { Button } from '../ui/Button'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export const ErrorFallback: React.FC<{ error: Error | null; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[50vh] max-w-md mx-auto gap-4">
      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center">
        <AlertOctagon className="h-10 w-10" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold text-brand-lightText">Something went wrong</h3>
        <p className="text-sm text-brand-lightText/60 leading-relaxed">
          An unexpected error occurred. Try refreshing or resetting the app.
        </p>
        {error && (
          <pre className="text-xs text-red-400 bg-brand-darkBg border border-brand-lightText/10 p-3 rounded-lg text-left overflow-x-auto max-w-full font-mono mt-2">
            {error.message}
          </pre>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={resetErrorBoundary} size="sm">
          Try Again
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </div>
    </div>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}
