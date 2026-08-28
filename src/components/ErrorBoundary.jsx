import React from "react";

/**
 * Without this, one malformed markdown or highlight render takes the whole app to a
 * blank white page with no way back except a manual reload.
 */
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("LiquidGPT crashed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-[var(--bg-primary)]">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 dark:border-[var(--border-primary)] bg-white dark:bg-[var(--bg-secondary)] p-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The app hit an unexpected error. Your saved conversations are untouched.
          </p>
          <pre className="text-left text-xs overflow-x-auto rounded-lg bg-gray-100 dark:bg-[var(--bg-tertiary)] p-3 mb-4 text-gray-700 dark:text-gray-300">
            {String(this.state.error?.message ?? this.state.error)}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 cursor-pointer text-sm bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-hover)] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
