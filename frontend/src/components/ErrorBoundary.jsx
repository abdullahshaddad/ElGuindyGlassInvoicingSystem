import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to console and potentially to an error reporting service
        console.error('Error caught by ErrorBoundary:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // You can also log the error to an error reporting service here
        // logErrorToService(error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                    <div className="sm:mx-auto sm:w-full sm:max-w-md">
                        <div className="text-center">
                            {/* Error Illustration */}
                            <div className="mx-auto w-32 h-32 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-8">
                                <span className="text-4xl">⚠️</span>
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                حدث خطأ غير متوقع
                            </h1>

                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                                عذراً، حدث خطأ في النظام. يرجى المحاولة مرة أخرى.
                            </p>

                            {/* Error Details (only in development) */}
                            {import.meta.env.DEV && this.state.error && (
                                <details className="mb-8 text-left">
                                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                                        تفاصيل الخطأ (للمطورين فقط)
                                    </summary>
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm">
                    <pre className="whitespace-pre-wrap text-red-800 dark:text-red-200 overflow-auto max-h-40">
                      {this.state.error.toString()}
                        {this.state.errorInfo.componentStack}
                    </pre>
                                    </div>
                                </details>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={this.handleReload}
                                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                                >
                                    إعادة تحميل الصفحة
                                </button>

                                <button
                                    onClick={this.handleGoHome}
                                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    العودة للرئيسية
                                </button>
                            </div>

                            <div className="mt-8">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    إذا استمر المشكل، يرجى التواصل مع الدعم الفني.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;