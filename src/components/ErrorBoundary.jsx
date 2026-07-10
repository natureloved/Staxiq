import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Always log — without this, production crashes vanish silently behind
    // the fallback UI. Swap for an error-reporting service when one is added.
    console.error('ErrorBoundary caught:', error, errorInfo?.componentStack);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo);
      }
      return (
        <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: '#0a0e1a' }}>
          <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: '#141c2e', border: '1px solid #1e2d4a' }}>
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f0f4ff' }}>Something went wrong</h2>
            <p className="text-sm mb-4" style={{ color: '#8899bb' }}>
              An unexpected error occurred. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="px-6 py-2 rounded-xl font-bold text-white text-sm transition-all"
              style={{ background: '#F7931A' }}
            >
              Try Again
            </button>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs cursor-pointer" style={{ color: '#f59e0b' }}>Error details (dev)</summary>
                <pre className="mt-2 p-3 rounded-lg text-xs overflow-auto" style={{ background: '#0d1117', color: '#f87171' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
