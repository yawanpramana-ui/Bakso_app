import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, X } from 'lucide-react';

interface Props {
  children?: ReactNode;
  componentName?: string;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught an error in ${this.props.componentName || 'component'}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#1e1726] border-4 border-red-600 rounded-2xl shadow-2xl p-5 text-amber-100 font-pixel space-y-4 text-center pixel-border-gold">
            <div className="flex items-center justify-between border-b border-red-800 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
                <h3 className="text-sm text-red-300">Modul {this.props.componentName || 'Game'} Terkendala</h3>
              </div>
              <button
                onClick={this.handleReset}
                className="p-1 rounded-lg bg-red-950 hover:bg-red-900 border border-red-700 text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] font-sans-clean text-amber-200/90 leading-relaxed text-left bg-red-950/40 p-3 rounded-xl border border-red-800/60">
              {this.state.error?.message || 'Terjadi kesalahan sistem saat memuat data. Silakan tekan Coba Lagi.'}
            </p>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#800000] hover:bg-red-800 text-[#ffd700] border-2 border-[#ffd700] rounded-xl text-xs font-bold shadow-lg active:scale-95 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Muat Ulang</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
