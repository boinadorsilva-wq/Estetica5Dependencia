import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-[40px] shadow-sm max-w-md w-full border border-rose-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-xl font-black text-slate-800 mb-2">Ops! Algo deu errado.</h1>
            <p className="text-sm text-slate-500 mb-6">
              Ocorreu um erro inesperado ao carregar esta parte do sistema. Tente recarregar a tela.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-200"
            >
              <RefreshCw size={18} />
              Recarregar Sistema
            </button>
            
            {/* Opcional: mostrar stack em dev */}
            {import.meta.env.MODE === 'development' && this.state.error && (
              <pre className="mt-6 p-4 bg-slate-100 text-[10px] text-slate-600 rounded-xl overflow-auto w-full text-left">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
