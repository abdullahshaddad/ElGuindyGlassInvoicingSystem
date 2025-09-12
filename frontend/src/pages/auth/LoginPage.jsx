import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import clsx from 'clsx';

const LoginPage = () => {
    const { t } = useTranslation();
    const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        rememberMe: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect if already authenticated
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear error when user starts typing
        if (error) {
            clearError();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await login({
                username: formData.username,
                password: formData.password,
            });

            if (result.success) {
                // Navigation will be handled by AppRouter based on user role
            }
        } catch (err) {
            console.error('Login failed:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center mb-6">
                        <span className="text-2xl font-bold text-white">G</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {t('auth.login.title')}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {t('auth.login.subtitle')}
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <div className="flex">
                                    <span className="text-red-400">⚠️</span>
                                    <div className="mr-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                            {t('auth.messages.login_failed')}
                                        </h3>
                                        <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                                            {error}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('auth.login.email')}
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className={clsx(
                                    'w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                                    'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                                    'border-gray-300 dark:border-gray-600',
                                    'focus:ring-primary-500 focus:border-primary-500',
                                    'placeholder-gray-400 dark:placeholder-gray-500'
                                )}
                                placeholder={t('forms.placeholder', { field: t('auth.login.email') })}
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('auth.login.password')}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className={clsx(
                                    'w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                                    'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                                    'border-gray-300 dark:border-gray-600',
                                    'focus:ring-primary-500 focus:border-primary-500',
                                    'placeholder-gray-400 dark:placeholder-gray-500'
                                )}
                                placeholder={t('forms.placeholder', { field: t('auth.login.password') })}
                            />
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="rememberMe"
                                    name="rememberMe"
                                    type="checkbox"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <label htmlFor="rememberMe" className="mr-2 text-sm text-gray-600 dark:text-gray-400">
                                    {t('auth.login.remember_me')}
                                </label>
                            </div>

                            <div className="text-sm">
                                <a
                                    href="/forgot-password"
                                    className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                                >
                                    {t('auth.login.forgot_password')}
                                </a>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={clsx(
                                    'w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg',
                                    'text-sm font-medium text-white',
                                    'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                                    'transition-colors duration-200',
                                    'disabled:opacity-50 disabled:cursor-not-allowed',
                                    'dark:focus:ring-offset-gray-800'
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoadingSpinner size="sm" color="white" className="ml-2" />
                                        {t('common.app.loading')}
                                    </>
                                ) : (
                                    t('auth.login.submit')
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('auth.login.no_account')}{' '}
                        <a
                            href="/register"
                            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        >
                            {t('auth.login.signup_link')}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;