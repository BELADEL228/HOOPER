import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    scope?: string;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(`[ErrorBoundary${this.props.scope ? `:${this.props.scope}` : ''}]`, error);
        console.error('Component stack:', info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
        this.props.onReset?.();
    };

    // 👇 C'EST ICI que va ton render()
    render() {
        if (!this.state.hasError) return this.props.children;

        // Fallback custom fourni par le parent
        if (this.props.fallback) return this.props.fallback;

        // 🐛 En DEV : stack trace complète
        if (import.meta.env.DEV) {
            return (
                <div className="p-6 rounded-2xl border-2 border-dashed border-red-500 bg-red-950/30 m-4">
                    <h3 className="text-red-400 font-black">
                        🐛 DEV — Erreur dans {this.props.scope || 'composant'}
                    </h3>
                    <pre className="text-xs text-red-200 mt-2 whitespace-pre-wrap break-words max-h-96 overflow-auto">
                        {this.state.error?.stack}
                    </pre>
                    <button
                        onClick={this.handleReset}
                        className="mt-3 px-3 py-1 bg-red-600 text-white rounded hover:brightness-110"
                    >
                        Reset
                    </button>
                </div>
            );
        }

        // 🚀 En PROD : UI propre
        return (
            <div className="max-w-2xl mx-auto my-8 p-6 rounded-3xl border border-red-500/30 bg-red-950/20">
                <h2 className="text-lg font-black text-white">
                    Une erreur est survenue{this.props.scope ? ` dans ${this.props.scope}` : ''}.
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                    Nous nous excusons pour la gêne. Essayez de recharger la section.
                </p>
                <button
                    onClick={this.handleReset}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#FF2A3B] text-white text-sm font-bold hover:brightness-110"
                >
                    Réessayer
                </button>
            </div>
        );
    }
}