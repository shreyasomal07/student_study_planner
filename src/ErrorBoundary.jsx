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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    localStorage.removeItem('study_planner_active_session_v2');
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#EBE6DF] text-[#1E2024] font-sans antialiased p-6 flex items-center justify-center">
          <div className="max-w-xl w-full bg-white rounded-[32px] p-6 sm:p-8 shadow-xl border border-rose-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold">
              ⚠️
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">Something went wrong</h2>
              <p className="text-xs text-stone-600 mt-1">
                An unexpected UI rendering error occurred. You can reload or reset your local session.
              </p>
            </div>
            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 overflow-x-auto text-[11px] font-mono text-rose-900 leading-relaxed max-h-48 overflow-y-auto">
              {this.state.error?.toString()}
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Reset Session & Return to Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
