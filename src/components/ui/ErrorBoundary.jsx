import React from 'react'

/**
 * ErrorBoundary — catches render-time errors and shows a fallback UI
 * instead of white-screening the entire app.
 *
 * Must be a class component — React has no hook equivalent for componentDidCatch.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#0a0a0a',
          color: '#e5e7eb',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#f87171' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1.5rem', maxWidth: '28rem' }}>
            The chart encountered an unexpected error. You can try resetting the view or reloading the page.
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1.5rem', maxWidth: '28rem', wordBreak: 'break-word' }}>
            {this.state.error?.message}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: '#1f2937',
                color: '#e5e7eb',
                border: '1px solid #374151',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
