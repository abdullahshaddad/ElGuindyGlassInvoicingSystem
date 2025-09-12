import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

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
                                <FiAlertTriangle className="w-16 h-16 text-white" />
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                حدث خطأ غير متوقع
                            </h1>

                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                                عذراً، حدث خطأ في النظام. يرجى المحاولة مرة أخرى.
                            </p>

                            {/* Action buttons */}
                            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse sm:flex sm:justify-center">
                                <button
                                    onClick={this.handleReload}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                                >
                                    <FiRefreshCw className="w-5 h-5" />
                                    إعادة تحميل الصفحة
                                </button>

                                <button
                                    onClick={this.handleGoHome}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                                >
                                    <FiHome className="w-5 h-5" />
                                    العودة للرئيسية
                                </button>
                            </div>

                            {/* Error details for development */}
                            {import.meta.env.DEV && this.state.error && (
                                <details className="mt-8 text-left">
                                    <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                        عرض تفاصيل الخطأ (للمطورين)
                                    </summary>
                                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-xs text-gray-800 dark:text-gray-200 overflow-auto">
                                        <h3 className="font-semibold mb-2">Error:</h3>
                                        <pre className="whitespace-pre-wrap mb-4">
                                            {this.state.error.toString()}
                                        </pre>

                                        {this.state.errorInfo && (
                                            <>
                                                <h3 className="font-semibold mb-2">Component Stack:</h3>
                                                <pre className="whitespace-pre-wrap">
                                                    {this.state.errorInfo.componentStack}
                                                </pre>
                                            </>
                                        )}
                                    </div>
                                </details>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;