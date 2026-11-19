import React from "react";
import { AlertTriangle, RefreshCw, Home, Trash2 } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ShopFlow Application Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndHome = () => {
    try {
      // Clear potentially corrupted cached user / session data
      localStorage.removeItem("user");
      localStorage.removeItem("shop");
      localStorage.removeItem("shopflow_cart");
      localStorage.removeItem("shopflow_active_shop");
    } catch {
      // ignore
    }
    window.location.href = "/";
  };

  handleClearAllAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                ShopFlow Encountered an Error
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                We detected an unexpected issue while rendering this view. Don't worry, your account and transactions are safe.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left">
                <p className="text-[11px] font-mono text-rose-400 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleResetAndHome}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer border border-slate-700"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home Safe State</span>
              </button>

              <button
                onClick={this.handleClearAllAndReset}
                className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-rose-400 py-1.5 text-[11px] transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Local Cache & Restart Session</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
