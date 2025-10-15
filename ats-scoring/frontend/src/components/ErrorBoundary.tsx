import React from 'react';

interface State {
  hasError: boolean;
  error?: Error | null;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can log the error to an error reporting service here
    // For now, just console.error so we have a stacktrace in devtools.
    console.error('Uncaught error in component tree:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <h1>Something went wrong</h1>
          <p>We're sorry — an unexpected error occurred while rendering the app.</p>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
