import { Component } from 'react';

// App-level safety net: a runtime error in any descendant (e.g. a stale
// `.map()` on null) would otherwise unmount the entire React tree and show the
// dev error overlay. This catches it and renders a recoverable fallback so the
// rest of the app stays usable.
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // Keep a console trail for debugging; swap for a real logger if needed.
        console.error('ErrorBoundary caught an error:', error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
                <div className="max-w-md w-full text-center bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-2xl">
                        !
                    </div>
                    <h1 className="text-lg font-bold text-gray-900 mb-1.5">Gözlənilməz xəta baş verdi</h1>
                    <p className="text-sm text-gray-500 mb-6">
                        Bir şey səhv getdi. Səhifəni yeniləyin və ya yenidən cəhd edin.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={this.handleReset}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                            Yenidən cəhd et
                        </button>
                        <button
                            onClick={() => window.location.assign('/')}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[var(--primary)] hover:opacity-90 transition-opacity cursor-pointer"
                        >
                            Ana səhifəyə qayıt
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
