import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  compact?: boolean;
  onReset?: () => void;
  key?: React.Key;
}

interface State {
  hasError: boolean;
  errorMsg: string;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMsg: '',
      showDetails: false
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      errorMsg: error?.message || 'A temporary visual glitch occurred.' 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Recovered from component error:', error?.message || error, errorInfo?.componentStack);
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, errorMsg: '', showDetails: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
    window.location.hash = 'home';
  };

  private handleTryAgain = () => {
    this.setState({ hasError: false, errorMsg: '', showDetails: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.compact) {
        return (
          <div className="w-full max-w-xl mx-auto my-8 p-6 rounded-2xl bg-white dark:bg-neutral-900/90 border-transparent dark:border-white/10 backdrop-blur-xl text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-transparent flex items-center justify-center mx-auto text-red-500 dark:text-red-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {this.props.fallbackTitle || 'Taking a quick pit stop'}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                {this.props.fallbackMessage || 'This section encountered a minor glitch, but everything else is running smoothly.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleTryAgain}
                className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold text-xs rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white font-semibold text-xs rounded-xl hover:bg-neutral-200 dark:hover:bg-white/15 transition-colors cursor-pointer flex items-center gap-1.5 border-transparent dark:border-white/10"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-neutral-950/90 border-transparent dark:border-white/10 p-7 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl text-center space-y-5">
            <div className="w-14 h-14 bg-red-500/10 border border-transparent rounded-2xl flex items-center justify-center mx-auto text-red-500 dark:text-red-400 shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {this.props.fallbackTitle || 'Smooth Sailing Ahead'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {this.props.fallbackMessage || "We encountered a temporary bump while displaying this view, but your saved data and session are completely safe."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-red-500 transition-colors shadow cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Continue Exploring</span>
              </button>
              <button
                type="button"
                onClick={this.handleTryAgain}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white font-semibold text-xs sm:text-sm rounded-xl hover:bg-neutral-200 dark:hover:bg-white/15 transition-colors cursor-pointer border-transparent dark:border-white/10"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>

            {/* Subtle Collapsible Tech Details */}
            <div className="pt-2 border-t border-neutral-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
              >
                <span>{this.state.showDetails ? 'Hide technical notice' : 'View technical notice'}</span>
                {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 bg-neutral-50 dark:bg-black/50 border-transparent dark:border-white/5 rounded-xl text-left overflow-x-auto">
                  <p className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 break-words">
                    {this.state.errorMsg || 'Non-fatal runtime notice caught.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

