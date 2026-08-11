import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * The last line of defence. Without one, a single render throw leaves a blank
 * white page with no way out — and on an installed PWA there is no address bar
 * to escape with either.
 *
 * A class component because this is the one thing hooks still cannot do.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // No analytics endpoint to report to, and inventing one would be worse
    // than the console for someone debugging their own install.
    console.error('RallyReady crashed:', error, info.componentStack)
  }

  override render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div className="max-w-sm text-center">
          <div className="bg-secondary mx-auto mb-5 grid size-14 place-items-center rounded-2xl">
            <svg viewBox="0 0 24 24" className="text-muted-foreground size-7" aria-hidden>
              <path
                d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Something broke</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            That is a bug in RallyReady, not something you did. Your logged sessions are safe —
            nothing is stored in the screen that failed.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring h-12 rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
            >
              Try that again
            </button>
            <a
              href="/"
              className="border-border hover:bg-secondary/60 focus-visible:ring-ring grid h-12 place-items-center rounded-xl border text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
            >
              Back to Train
            </a>
          </div>

          <details className="mt-6 text-left">
            <summary className="text-muted-foreground cursor-pointer text-xs">
              Technical detail
            </summary>
            <pre className="text-muted-foreground mt-2 overflow-x-auto rounded-lg border p-3 text-[0.6875rem] leading-relaxed">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}
