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
        <div className="min-h-screen bg-wild-light text-liminal-night font-sans antialiased p-6 flex items-center justify-center">
          <div className="max-w-xl w-full bg-steady-renewal rounded-3xl p-6 sm:p-8 shadow-xl border border-rooted-strength/40 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-wild-light text-liminal-night flex items-center justify-center text-xl font-bold border border-rooted-strength/40">
              ️
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-liminal-night tracking-tight">Something went wrong</h2>
              <p className="text-xs text-liminal-night/70 mt-1 font-medium">
                An unexpected UI rendering error occurred. You can reload or reset your local session.
              </p>
            </div>
            <div className="p-3.5 bg-wild-light rounded-2xl border border-rooted-strength/40 overflow-x-auto text-[11px] font-mono text-liminal-night leading-relaxed max-h-48 overflow-y-auto">
              {this.state.error?.toString()}
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-full bg-liminal-night hover:bg-liminal-night/90 text-wild-light text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-full bg-wild-light hover:bg-steady-renewal border border-rooted-strength/40 text-liminal-night text-xs font-bold transition-all cursor-pointer"
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
