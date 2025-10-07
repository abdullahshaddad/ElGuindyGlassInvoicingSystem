import React, {Suspense} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {AuthProvider} from '@/contexts/AuthContext';
import {ThemeProvider} from '@/contexts/ThemeContext';
import AppRouter from '@/components/AppRouter';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import {SnackbarProvider} from "@contexts/SnackbarContext.jsx";

// Create a client for React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1, refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000, // 5 minutes
        }, mutations: {
            retry: 1,
        },
    },
});

// Global loading fallback
const GlobalLoader = () => (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
            <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl font-bold text-white">G</span>
            </div>
            <LoadingSpinner size="lg"/>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
                جاري تحميل النظام...
            </p>
        </div>
    </div>);

function App() {
    return (<ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <AuthProvider>
                        <SnackbarProvider>
                            <Suspense fallback={<GlobalLoader/>}>
                                <div
                                    className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                                    <AppRouter/>
                                </div>
                            </Suspense>
                        </SnackbarProvider>
                    </AuthProvider>
                </ThemeProvider>

                {/* React Query Devtools - only in development */}
                {import.meta.env.DEV && (<ReactQueryDevtools
                        initialIsOpen={false}
                        position="bottom-right"
                    />)}
            </QueryClientProvider>
        </ErrorBoundary>);
}

export default App;