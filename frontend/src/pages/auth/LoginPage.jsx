import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
    const { t, i18n } = useTranslation('auth');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('Login attempt:', { username, password, rememberMe });
        setIsLoading(false);
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ar' ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
    };

    return (
        <div
            className="min-h-screen flex"
            dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
        >
            {/* Left Side - Brand/Hero Section */}
            <div
                className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
                style={{
                    backgroundImage: `linear-gradient(rgba(0, 119, 182, 0.8), rgba(63, 167, 150, 0.8)), url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI2MDAiIHZpZXdCb3g9IjAgMCAxMDAwIDYwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPgo8L3BhdHRlcm4+CjwvZGVmcz4KPHJLY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMDAiIGhlaWdodD0iNjAwIi8+Cjwvc3ZnPg==')`
                }}
            >
                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col justify-center p-16 text-white">
                    {/* Logo */}
                    <div className="mb-8">
                        <div
                            className="inline-flex items-center justify-center w-16 h-16 mb-4"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: 'var(--border-radius-2xl, 1.5rem)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            <span
                                className="text-2xl font-bold text-white"
                                style={{ fontWeight: 'var(--font-weight-bold, 700)' }}
                            >
                                G
                            </span>
                        </div>
                        <h1
                            className="text-sm font-medium tracking-widest mb-2"
                            style={{
                                fontSize: 'var(--font-size-sm, 0.875rem)',
                                fontWeight: 'var(--font-weight-medium, 500)',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase'
                            }}
                        >
                            {i18n.language === 'ar' ? 'الجندي للزجاج' : 'ELGUINDY GLASS'}
                        </h1>
                    </div>

                    {/* Main Content */}
                    <div className="max-w-md">
                        <h2
                            className="text-5xl font-bold leading-tight mb-6"
                            style={{
                                fontSize: 'var(--font-size-4xl, 2.25rem)',
                                fontWeight: 'var(--font-weight-black, 900)',
                                lineHeight: 'var(--line-height-tight, 1.25)'
                            }}
                        >
                            {i18n.language === 'ar' ? (
                                <>
                                    صمم
                                    <br />
                                    واصنع
                                    <br />
                                    بالزجاج
                                </>
                            ) : (
                                <>
                                    CRAFT
                                    <br />
                                    BEAUTIFUL
                                    <br />
                                    GLASS
                                </>
                            )}
                        </h2>

                        <p
                            className="text-lg mb-8"
                            style={{
                                fontSize: 'var(--font-size-lg, 1.125rem)',
                                lineHeight: 'var(--line-height-relaxed, 1.625)',
                                opacity: '0.9'
                            }}
                        >
                            {i18n.language === 'ar'
                                ? 'نظام إدارة شامل لمصنع الزجاج، من التصميم إلى التصنيع والتسليم'
                                : 'Complete management system for glass manufacturing, from design to production and delivery'
                            }
                        </p>

                        <div className="text-sm opacity-75">
                            {i18n.language === 'ar'
                                ? 'حيث تتحول رؤيتك إلى واقع زجاجي'
                                : 'Where Your Vision Becomes Glass Reality'
                            }
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-20 right-20 w-32 h-32 border border-white/20 rounded-full"></div>
                <div className="absolute bottom-20 left-20 w-24 h-24 border border-white/20 rounded-lg transform rotate-45"></div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8">
                {/* Language Toggle */}
                <div className="absolute top-6 right-6 lg:top-8 lg:right-8">
                    <button
                        onClick={toggleLanguage}
                        className="px-4 py-2 text-sm font-medium transition-colors rounded-full"
                        style={{
                            backgroundColor: 'rgb(var(--bg-secondary))',
                            color: 'rgb(var(--text-primary))',
                            border: `1px solid rgb(var(--border-light))`,
                            fontSize: 'var(--font-size-sm, 0.875rem)',
                            borderRadius: 'var(--border-radius-full, 9999px)',
                            transition: 'var(--transition-fast, 0.15s ease-in-out)'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = `rgb(var(--color-primary))`;
                            e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = `rgb(var(--bg-secondary))`;
                            e.target.style.color = `rgb(var(--text-primary))`;
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
                            className="inline-flex items-center justify-center w-12 h-12 mb-4 mx-auto"
                            style={{
                                backgroundColor: `rgb(var(--color-primary))`,
                                borderRadius: 'var(--border-radius-xl, 1rem)'
                            }}
                        >
                            <span className="text-lg font-bold text-white">G</span>
                        </div>
                        <h1
                            className="text-xl font-bold"
                            style={{
                                color: 'rgb(var(--text-primary))',
                                fontSize: 'var(--font-size-xl, 1.25rem)',
                                fontWeight: 'var(--font-weight-bold, 700)'
                            }}
                        >
                            {t('app.name', { defaultValue: 'النظام العربي' })}
                        </h1>
                    </div>

                    {/* Form Header */}
                    <div className="mb-8">
                        <h2
                            className="text-3xl font-bold mb-2"
                            style={{
                                color: 'rgb(var(--text-primary))',
                                fontSize: 'var(--font-size-3xl, 1.875rem)',
                                fontWeight: 'var(--font-weight-bold, 700)'
                            }}
                        >
                            {t('login.title')}
                        </h2>
                        <p
                            style={{
                                color: 'rgb(var(--text-secondary))',
                                fontSize: 'var(--font-size-base, 1rem)'
                            }}
                        >
                            {t('login.subtitle')}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Field */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block font-medium mb-2"
                                style={{
                                    color: 'rgb(var(--text-primary))',
                                    fontSize: 'var(--font-size-sm, 0.875rem)',
                                    fontWeight: 'var(--font-weight-medium, 500)'
                                }}
                            >
                                {t('login.username', { defaultValue: 'اسم المستخدم' })}
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="w-full transition-all duration-200 focus:outline-none"
                                style={{
                                    padding: 'var(--spacing-md, 1rem)',
                                    backgroundColor: 'rgb(var(--bg-primary))',
                                    border: `2px solid rgb(var(--border-light))`,
                                    borderRadius: 'var(--border-radius-lg, 0.75rem)',
                                    color: 'rgb(var(--text-primary))',
                                    fontSize: 'var(--font-size-base, 1rem)'
                                }}
                                placeholder={t('login.username', { defaultValue: 'اسم المستخدم' })}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={(e) => {
                                    e.target.style.borderColor = `rgb(var(--color-primary))`;
                                    e.target.style.boxShadow = `0 0 0 3px rgba(var(--color-primary), 0.1)`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = `rgb(var(--border-light))`;
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
                                    color: 'rgb(var(--text-primary))',
                                    fontSize: 'var(--font-size-sm, 0.875rem)',
                                    fontWeight: 'var(--font-weight-medium, 500)'
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
                                    className="w-full transition-all duration-200 focus:outline-none"
                                    style={{
                                        padding: `var(--spacing-md, 1rem) ${i18n.language === 'ar' ? 'var(--spacing-xl, 2rem) var(--spacing-md, 1rem) var(--spacing-md, 1rem)' : 'var(--spacing-md, 1rem) var(--spacing-xl, 2rem) var(--spacing-md, 1rem) var(--spacing-md, 1rem)'}`,
                                        backgroundColor: 'rgb(var(--bg-primary))',
                                        border: `2px solid rgb(var(--border-light))`,
                                        borderRadius: 'var(--border-radius-lg, 0.75rem)',
                                        color: 'rgb(var(--text-primary))',
                                        fontSize: 'var(--font-size-base, 1rem)'
                                    }}
                                    placeholder={t('login.password')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = `rgb(var(--color-primary))`;
                                        e.target.style.boxShadow = `0 0 0 3px rgba(var(--color-primary), 0.1)`;
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = `rgb(var(--border-light))`;
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute inset-y-0 ${i18n.language === 'ar' ? 'left-3' : 'right-3'} flex items-center`}
                                    style={{
                                        color: 'rgb(var(--text-muted))'
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
                                    style={{
                                        accentColor: `rgb(var(--color-primary))`,
                                        marginLeft: i18n.language === 'ar' ? 'var(--spacing-sm, 0.5rem)' : '0',
                                        marginRight: i18n.language === 'ar' ? '0' : 'var(--spacing-sm, 0.5rem)'
                                    }}
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span
                                    style={{
                                        color: 'rgb(var(--text-primary))',
                                        fontSize: 'var(--font-size-sm, 0.875rem)'
                                    }}
                                >
                                    {t('login.remember_me')}
                                </span>
                            </label>

                            <a
                                href="#"
                                className="font-medium hover:underline"
                                style={{
                                    color: 'rgb(var(--color-primary))',
                                    fontSize: 'var(--font-size-sm, 0.875rem)',
                                    fontWeight: 'var(--font-weight-medium, 500)'
                                }}
                            >
                                {t('login.forgot_password')}
                            </a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full font-semibold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                padding: 'var(--spacing-lg, 1.5rem)',
                                borderRadius: 'var(--border-radius-lg, 0.75rem)',
                                fontSize: 'var(--font-size-base, 1rem)',
                                fontWeight: 'var(--font-weight-semibold, 600)'
                            }}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    جاري تسجيل الدخول...
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