import { Component, type ReactNode } from 'react'
import { Button } from './ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import * as Sentry from '@sentry/react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
    Sentry.captureException(error, { extra: errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-gs-red-dim)]">
              <AlertTriangle className="h-7 w-7 text-[var(--color-gs-red)]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-bold text-[var(--color-gs-text)]">
                Algo deu errado
              </h3>
              <p className="font-mono text-sm text-[var(--color-gs-muted)]">
                {this.state.error?.message || 'Erro desconhecido'}
              </p>
            </div>
            <Button
              onClick={this.handleReset}
              className="gap-2 bg-[var(--color-gs-green)] text-[var(--color-gs-bg)] hover:bg-[var(--color-gs-green)]/90"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
