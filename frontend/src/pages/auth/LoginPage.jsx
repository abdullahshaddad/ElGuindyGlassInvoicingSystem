import React from 'react';
import { useTranslation } from 'react-i18next';
import { SignIn } from '@clerk/clerk-react';
import logo from '@/assets/logo elguindy-1.png';

const LoginPage = () => {
    const { i18n } = useTranslation('auth');

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ar' ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
    };

    return (
        <div
            className="min-h-screen flex"
            dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
            style={{ backgroundColor: '#ffffff' }}
        >
            {/* Left Side - Professional Corporate Section */}
            <div
                className="hidden lg:flex lg:w-1/2 relative"
                style={{ backgroundColor: '#e3f2fd' }}
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
                        <div className="flex items-start p-4 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
                            <div className="flex-shrink-0" style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i18n.language === 'ar' ? '12px' : '0', marginRight: i18n.language === 'ar' ? '0' : '12px' }}>
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

                        <div className="flex items-start p-4 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
                            <div className="flex-shrink-0" style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i18n.language === 'ar' ? '12px' : '0', marginRight: i18n.language === 'ar' ? '0' : '12px' }}>
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

                        <div className="flex items-start p-4 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
                            <div className="flex-shrink-0" style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i18n.language === 'ar' ? '12px' : '0', marginRight: i18n.language === 'ar' ? '0' : '12px' }}>
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
                    <div className="mt-12" style={{ width: '60px', height: '4px', backgroundColor: '#0077B6', borderRadius: '2px' }} />
                </div>
            </div>

            {/* Right Side - Clerk Sign In */}
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
                        }}
                    >
                        {i18n.language === 'ar' ? 'English' : 'العربية'}
                    </button>
                </div>

                <div className="w-full max-w-md flex flex-col items-center">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div
                            className="inline-flex items-center justify-center mb-4 mx-auto p-3"
                            style={{ backgroundColor: '#0077B6', borderRadius: '1rem' }}
                        >
                            <img
                                src={logo}
                                alt="El Guindy Logo"
                                style={{ height: '60px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                            />
                        </div>
                        <h1 className="text-xl font-bold" style={{ color: '#1f2937' }}>
                            {i18n.language === 'ar' ? 'الجندي للزجاج' : 'El Guindy Glass'}
                        </h1>
                    </div>

                    {/* Clerk Sign-In Component */}
                    <SignIn
                        routing="hash"
                        afterSignInUrl="/"
                        appearance={{
                            elements: {
                                rootBox: 'w-full',
                                card: 'shadow-none w-full bg-transparent',
                                headerTitle: 'text-2xl font-bold text-gray-900',
                                headerSubtitle: 'text-gray-500',
                                formButtonPrimary: 'bg-[#0077B6] hover:bg-[#005f8f] text-white rounded-lg py-3 text-base font-semibold',
                                formFieldInput: 'rounded-lg border-gray-300 focus:border-[#0077B6] focus:ring-[#0077B6] py-3',
                                formFieldLabel: 'text-gray-700 font-medium',
                                footerAction: 'hidden',
                                footer: 'hidden',
                                dividerLine: 'hidden',
                                dividerText: 'hidden',
                                socialButtonsBlockButton: 'hidden',
                                socialButtonsProviderIcon: 'hidden',
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
