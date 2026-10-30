import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  retryCount: number;
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, retryCount: 0 };

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[Dopool Guard] Caught runtime render error, recovering session:', error?.message);
    if (this.state.retryCount < 3) {
      setTimeout(() => {
        this.setState((prev) => ({ hasError: false, retryCount: prev.retryCount + 1 }));
      }, 60);
    }
  }

  handleManualRecover = () => {
    this.setState({ hasError: false, retryCount: 0 });
  };

  render() {
    if (this.state.hasError && this.state.retryCount >= 3) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#060913] text-white flex flex-col items-center justify-center p-6 text-center font-sans"
        >
          <div className="max-w-xs w-full rounded-3xl bg-slate-900/90 border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 flex items-center justify-center mx-auto text-xl font-black">
              ⚡
            </div>
            <h2 className="text-sm font-black text-white">بازیابی خودکار برنامه</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              اطلاعات حساب و کیف پول شما کاملاً محفوظ است. برای ادامه روی دکمه زیر بزنید.
            </p>
            <button
              type="button"
              onClick={this.handleManualRecover}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
            >
              ادامه در همان صفحه
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

// Register Service Worker for Mobile Notifications & PWA
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration note:', err);
    });
  });
}
