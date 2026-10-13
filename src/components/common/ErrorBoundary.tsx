import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App caught runtime error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      // Clear potentially corrupt cached transactions
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFBF5] text-[#1E293B] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl border-3 border-[#1E293B] shadow-[0_6px_0_#1E293B] p-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2
                className="text-xl font-black text-[#1E293B]"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                NYC Ledger Restoring
              </h2>
              <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                A temporary interface issue occurred. Your offline financial data is safe.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-[#FCCE4C] hover:bg-[#ebd05a] text-[#1E293B] font-black text-sm rounded-xl border-2 border-[#1E293B] shadow-[0_2px_0_#1E293B] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                <span>Reload NYC Ledger</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetStorage}
                className="w-full py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl border border-stone-300 transition-colors cursor-pointer"
              >
                Clear Temp Cache & Restart
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-700 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Offline Ledger Protection Active</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
