import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  fallback?: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Block render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="py-8 px-6 text-center bg-red-50 border border-red-200 rounded-xl my-4">
            <p className="text-red-600 text-sm font-medium">
              A component failed to render.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-2 text-xs text-red-500 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}
