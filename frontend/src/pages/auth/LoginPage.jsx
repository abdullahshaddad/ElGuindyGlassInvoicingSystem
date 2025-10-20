import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo elguindy-1.png';

const LoginPage = () => {
    const { t, i18n } = useTranslation('auth');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const getRedirectPath = (userRole) => {
        const from = location.state?.from;
        if (from && from !== '/login') {
            return from;
        }

        switch (userRole) {
            case 'OWNER':
                return '/dashboard';
            case 'CASHIER':
                return '/cashier';
            case 'WORKER':
                return '/factory';
            default:
                return '/dashboard';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError(t('messages.invalid_credentials', 'Invalid credentials'));
            return;
        }

        setIsLoading(true);

        try {
            const result = await login({
                username: username.trim(),
                password: password
            });

            if (result.success) {
                const redirectPath = getRedirectPath(result.user?.role);
                navigate(redirectPath, { replace: true });
            } else {
                setError(getErrorMessage(result.error));
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(getErrorMessage(error.message || error));
        } finally {
            setIsLoading(false);
        }
    };

    const getErrorMessage = (errorString) => {
        if (typeof errorString !== 'string') {
            return t('messages.login_failed', 'Login failed. Please check your credentials');
        }

        const errorLower = errorString.toLowerCase();

        if (errorLower.includes('invalid') || errorLower.includes('credentials') || errorLower.includes('unauthorized')) {
            return t('messages.invalid_credentials', 'Invalid credentials');
        }

        if (errorLower.includes('user not found') || errorLower.includes('not found')) {
            return t('messages.invalid_credentials', 'Invalid credentials');
        }

        if (errorLower.includes('network') || errorLower.includes('connection')) {
            return i18n.language === 'ar'
                ? 'خطأ في الاتصال. يرجى التحقق من الاتصال بالإنترنت.'
                : 'Network error. Please check your connection.';
        }

        if (errorLower.includes('timeout')) {
            return i18n.language === 'ar'
                ? 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.'
                : 'Request timeout. Please try again.';
        }

        return t('messages.login_failed', 'Login failed. Please check your credentials');
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ar' ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
    };

    const clearError = () => {
        setError('');
    };

    return (
        <div
            className="min-h-screen flex"
            dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
            style={{
                backgroundColor: '#ffffff'
            }}
        >
            {/* Left Side - Professional Corporate Section */}
            <div
                className="hidden lg:flex lg:w-1/2 relative"
                style={{
                    backgroundColor: '#e3f2fd'
                }}
            >
                <div className="flex flex-col justify-center items-center w-full p-16">
                    {/* Logo Container */}
                    <div className="mb-12">
                        <div
                            style={{
                                padding: '1.5rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '1rem',
                                border: '2px solid #e5e7eb',
                                display: 'inline-block'
                            }}
                        >
                            <img
                                src={logo}
                                alt="El Guindy Logo"
                                style={{
                                    height: '100px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                    display: 'block'
                                }}
                            />
                        </div>
                    </div>

                    {/* Company Name */}
                    <h1
                        className="text-center mb-4"
                        style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            letterSpacing: '0.025em'
                        }}
                    >
                        {i18n.language === 'ar' ? 'الجندي للزجاج' : 'EL GUINDY GLASS'}
                    </h1>

                    {/* Tagline */}
                    <p
                        className="text-center mb-12"
                        style={{
                            fontSize: '1.125rem',
                            color: '#6b7280',
                            maxWidth: '500px',
                            lineHeight: '1.75'
                        }}
                    >
                        {i18n.language === 'ar'
                            ? 'نظام إدارة متكامل لصناعة الزجاج'
                            : 'Integrated Management System for Glass Manufacturing'
                        }
                    </p>

                    {/* Features */}
                    <div className="w-full max-w-md space-y-4">
                        {/* Feature 1 */}
                        <div
                            className="flex items-start p-4 rounded-lg"
                            style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb'
                            }}
                        >
                            <div
                                className="flex-shrink-0"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#e0f2fe',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: i18n.language === 'ar' ? '12px' : '0',
                                    marginRight: i18n.language === 'ar' ? '0' : '12px'
                                }}
                            >
                                <svg style={{ width: '20px', height: '20px', color: '#0077B6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
                                    {i18n.language === 'ar' ? 'إدارة شاملة' : 'Complete Management'}
                                </h3>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    {i18n.language === 'ar' ? 'من التصميم إلى التسليم' : 'From design to delivery'}
                                </p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div
                            className="flex items-start p-4 rounded-lg"
                            style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb'
                            }}
                        >
                            <div
                                className="flex-shrink-0"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#e0f2fe',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: i18n.language === 'ar' ? '12px' : '0',
                                    marginRight: i18n.language === 'ar' ? '0' : '12px'
                                }}
                            >
                                <svg style={{ width: '20px', height: '20px', color: '#0077B6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
                                    {i18n.language === 'ar' ? 'كفاءة عالية' : 'High Efficiency'}
                                </h3>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    {i18n.language === 'ar' ? 'أتمتة العمليات وتوفير الوقت' : 'Process automation and time-saving'}
                                </p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div
                            className="flex items-start p-4 rounded-lg"
                            style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb'
                            }}
                        >
                            <div
                                className="flex-shrink-0"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#e0f2fe',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: i18n.language === 'ar' ? '12px' : '0',
                                    marginRight: i18n.language === 'ar' ? '0' : '12px'
                                }}
                            >
                                <svg style={{ width: '20px', height: '20px', color: '#0077B6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
                                    {i18n.language === 'ar' ? 'تقارير متقدمة' : 'Advanced Reports'}
                                </h3>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    {i18n.language === 'ar' ? 'تحليلات وتقارير شاملة' : 'Comprehensive analytics and reporting'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Accent */}
                    <div
                        className="mt-12"
                        style={{
                            width: '60px',
                            height: '4px',
                            backgroundColor: '#0077B6',
                            borderRadius: '2px'
                        }}
                    />
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8" style={{ backgroundColor: '#ffffff' }}>
                {/* Language Toggle */}
                <div className="absolute top-6 right-6 lg:top-8 lg:right-8">
                    <button
                        onClick={toggleLanguage}
                        className="px-4 py-2 text-sm font-medium transition-colors rounded-full"
                        style={{
                            backgroundColor: '#f3f4f6',
                            color: '#1f2937',
                            border: '1px solid #e5e7eb',
                            fontSize: '0.875rem',
                            borderRadius: '9999px',
                            transition: '0.15s ease-in-out'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#0077B6';
                            e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = '#f3f4f6';
                            e.target.style.color = '#1f2937';
                        }}
                    >
                        {i18n.language === 'ar' ? 'English' : 'العربية'}
                    </button>
                </div>

                {/* Login Form */}
                <div className="w-full max-w-md">
                    {/* Mobile Logo - Only shown on small screens */}
                    <div className="lg:hidden text-center mb-8">
                        <div
                            className="inline-flex items-center justify-center mb-4 mx-auto p-3"
                            style={{
                                backgroundColor: '#0077B6',
                                borderRadius: '1rem'
                            }}
                        >
                            <img
                                src={logo}
                                alt="El Guindy Logo"
                                style={{
                                    height: '60px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                    filter: 'brightness(0) invert(1)'
                                }}
                            />
                        </div>
                        <h1
                            className="text-xl font-bold"
                            style={{
                                color: '#1f2937',
                                fontSize: '1.25rem',
                                fontWeight: '700'
                            }}
                        >
                            {t('app.name', { defaultValue: i18n.language === 'ar' ? 'الجندي للزجاج' : 'El Guindy Glass' })}
                        </h1>
                    </div>

                    {/* Form Header */}
                    <div className="mb-8">
                        <h2
                            className="text-3xl font-bold mb-2"
                            style={{
                                color: '#1f2937',
                                fontSize: '1.875rem',
                                fontWeight: '700'
                            }}
                        >
                            {t('login.title')}
                        </h2>
                        <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                            {t('login.subtitle')}
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                            <div className="flex items-start">
                                <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444', marginTop: '2px' }} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1" style={{ marginLeft: i18n.language === 'ar' ? '0' : '12px', marginRight: i18n.language === 'ar' ? '12px' : '0' }}>
                                    <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>
                                    <button
                                        onClick={clearError}
                                        className="mt-2 text-xs underline"
                                        style={{
                                            color: '#dc2626',
                                            textAlign: i18n.language === 'ar' ? 'right' : 'left'
                                        }}
                                        onMouseOver={(e) => { e.target.style.color = '#991b1b'; }}
                                        onMouseOut={(e) => { e.target.style.color = '#dc2626'; }}
                                    >
                                        {i18n.language === 'ar' ? 'إخفاء' : 'Dismiss'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Field */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block font-medium mb-2"
                                style={{
                                    color: '#1f2937',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}
                            >
                                {t('login.username', { defaultValue: 'اسم المستخدم' })}
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                disabled={isLoading}
                                className="w-full transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    padding: '1rem',
                                    backgroundColor: '#ffffff',
                                    border: `2px solid ${error && !username.trim() ? '#ef4444' : '#e5e7eb'}`,
                                    borderRadius: '0.75rem',
                                    color: '#1f2937',
                                    fontSize: '1rem'
                                }}
                                placeholder={t('login.username', { defaultValue: 'اسم المستخدم' })}
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (error) clearError();
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#0077B6';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 119, 182, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = error && !username.trim() ? '#ef4444' : '#e5e7eb';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block font-medium mb-2"
                                style={{
                                    color: '#1f2937',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}
                            >
                                {t('login.password')}
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    disabled={isLoading}
                                    className="w-full transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        padding: i18n.language === 'ar' ? '1rem 3rem 1rem 1rem' : '1rem 1rem 1rem 3rem',
                                        paddingRight: i18n.language === 'ar' ? '3rem' : '1rem',
                                        paddingLeft: i18n.language === 'ar' ? '1rem' : '3rem',
                                        backgroundColor: '#ffffff',
                                        border: `2px solid ${error && !password.trim() ? '#ef4444' : '#e5e7eb'}`,
                                        borderRadius: '0.75rem',
                                        color: '#1f2937',
                                        fontSize: '1rem'
                                    }}
                                    placeholder={t('login.password')}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) clearError();
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#0077B6';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(0, 119, 182, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = error && !password.trim() ? '#ef4444' : '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                    className="absolute inset-y-0 flex items-center disabled:opacity-50"
                                    style={{
                                        left: i18n.language === 'ar' ? '12px' : 'auto',
                                        right: i18n.language === 'ar' ? 'auto' : '12px',
                                        color: '#9ca3af'
                                    }}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="w-4 h-4 rounded"
                                    disabled={isLoading}
                                    style={{
                                        accentColor: '#0077B6',
                                        marginLeft: i18n.language === 'ar' ? '0.5rem' : '0',
                                        marginRight: i18n.language === 'ar' ? '0' : '0.5rem'
                                    }}
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span
                                    style={{
                                        color: '#1f2937',
                                        fontSize: '0.875rem',
                                        opacity: isLoading ? '0.5' : '1'
                                    }}
                                >
                                    {t('login.remember_me')}
                                </span>
                            </label>

                            <a
                                href="#"
                                className={`font-medium hover:underline ${isLoading ? 'pointer-events-none' : ''}`}
                                style={{
                                    color: '#0077B6',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    opacity: isLoading ? '0.5' : '1'
                                }}
                            >
                                {t('login.forgot_password')}
                            </a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !username.trim() || !password.trim()}
                            className="w-full font-semibold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                fontSize: '1rem',
                                fontWeight: '600',
                                backgroundColor: '#0077B6',
                                color: '#ffffff',
                                border: 'none'
                            }}
                            onMouseOver={(e) => {
                                if (!isLoading && username.trim() && password.trim()) {
                                    e.target.style.backgroundColor = '#005f8f';
                                }
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = '#0077B6';
                            }}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        style={{
                                            marginLeft: i18n.language === 'ar' ? '12px' : '0',
                                            marginRight: i18n.language === 'ar' ? '0' : '12px'
                                        }}
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {i18n.language === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...'}
                                </div>
                            ) : (
                                t('login.submit')
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;