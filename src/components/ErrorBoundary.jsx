import { Component } from 'react'

/**
 * ErrorBoundary
 * Catches render/lifecycle errors and displays a fallback UI instead of a blank white screen.
 * Note: Does not catch infinite loops (browser hangs before React error handling runs).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-primary to-bg-secondary">
          <div className="p-8 text-center max-w-md">
            <p className="text-lg text-text-primary mb-2 font-serif">Something went wrong</p>
            <p className="text-text-secondary text-sm mb-4">
              An error occurred while loading this view. Try reloading the page.
            </p>
            <p className="text-xs font-mono text-text-secondary/60 break-words mb-6">
              {this.state.error.message}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 rounded bg-accent/20 hover:bg-accent/30 text-accent text-sm transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
