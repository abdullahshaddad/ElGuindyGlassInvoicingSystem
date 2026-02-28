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
        <>
            {/* Override Clerk internal styles that cause cropping */}
            <style>{`
                .cl-internal-b3fm6y { max-width: none !important; }
                .cl-card { box-shadow: none !important; border: none !important; padding: 0 !important; background: transparent !important; width: 100% !important; max-width: none !important; }
                .cl-cardBox { box-shadow: none !important; width: 100% !important; max-width: none !important; overflow: visible !important; }
                .cl-rootBox { width: 100% !important; }
                .cl-header { display: none !important; }
                .cl-footer { display: none !important; }
                .cl-socialButtons { display: none !important; }
                .cl-dividerRow { display: none !important; }
                .cl-formButtonPrimary {
                    background-color: rgb(var(--color-primary-500)) !important;
                    border-radius: 10px !important;
                    font-weight: 600 !important;
                    font-size: 0.9rem !important;
                    padding: 10px 0 !important;
                    box-shadow: none !important;
                    text-transform: none !important;
                }
                .cl-formButtonPrimary:hover { background-color: rgb(var(--color-primary-700)) !important; }
                .cl-formFieldInput {
                    border: 1px solid #d1d5db !important;
                    border-radius: 10px !important;
                    background-color: #f9fafb !important;
                    font-size: 0.9rem !important;
                    padding: 10px 12px !important;
                    color: #111827 !important;
                    box-shadow: none !important;
                    direction: ltr !important;
                    text-align: left !important;
                }
                .cl-formFieldInput:focus {
                    border-color: rgb(var(--color-primary-500)) !important;
                    box-shadow: 0 0 0 1px rgb(var(--color-primary-500)) !important;
                    background-color: #ffffff !important;
                }
                .cl-formFieldLabel {
                    color: #374151 !important;
                    font-weight: 500 !important;
                    font-size: 0.85rem !important;
                }
                .cl-formFieldAction__password { color: rgb(var(--color-primary-500)) !important; font-size: 0.8rem !important; }
                .cl-formFieldAction__password:hover { color: rgb(var(--color-primary-700)) !important; }
                .cl-identityPreviewEditButton { color: rgb(var(--color-primary-500)) !important; }
                .cl-identityPreviewEditButton:hover { color: rgb(var(--color-primary-700)) !important; }
                .cl-formResendCodeLink { color: rgb(var(--color-primary-500)) !important; }
                .cl-backLink { color: rgb(var(--color-primary-500)) !important; }
                .cl-backLink:hover { color: rgb(var(--color-primary-700)) !important; }
                .cl-otpCodeFieldInput { border-color: #d1d5db !important; }
                .cl-otpCodeFieldInput:focus { border-color: rgb(var(--color-primary-500)) !important; }
                .cl-alert { border-radius: 8px !important; }
                .cl-identityPreview { border-radius: 10px !important; border-color: #e5e7eb !important; }
            `}</style>

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
                                    alt="Kwartz Logo"
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
                            {i18n.language === 'ar' ? 'كوارتز' : 'KWARTZ'}
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
                                    <svg style={{ width: '20px', height: '20px', color: 'rgb(var(--color-primary-500))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    <svg style={{ width: '20px', height: '20px', color: 'rgb(var(--color-primary-500))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    <svg style={{ width: '20px', height: '20px', color: 'rgb(var(--color-primary-500))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <div className="mt-12" style={{ width: '60px', height: '4px', backgroundColor: 'rgb(var(--color-primary-500))', borderRadius: '2px' }} />
                    </div>
                </div>

                {/* Right Side - Clerk Sign In */}
                <div
                    className="flex-1 lg:w-1/2 flex items-center justify-center relative"
                    style={{ backgroundColor: '#ffffff', padding: '32px 24px' }}
                >
                    {/* Language Toggle */}
                    <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                        <button
                            onClick={toggleLanguage}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                            }}
                        >
                            {i18n.language === 'ar' ? 'English' : 'العربية'}
                        </button>
                    </div>

                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        {/* Mobile Logo */}
                        <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '16px',
                                    padding: '12px',
                                    backgroundColor: 'rgb(var(--color-primary-500))',
                                    borderRadius: '1rem',
                                }}
                            >
                                <img
                                    src={logo}
                                    alt="Kwartz Logo"
                                    style={{ height: '60px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                                />
                            </div>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                                {i18n.language === 'ar' ? 'كوارتز' : 'Kwartz'}
                            </h1>
                        </div>

                        {/* Welcome Text */}
                        <div style={{ marginBottom: '28px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>
                                {i18n.language === 'ar' ? 'تسجيل الدخول' : 'Welcome back'}
                            </h2>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {i18n.language === 'ar' ? 'أدخل بياناتك للمتابعة' : 'Enter your credentials to continue'}
                            </p>
                        </div>

                        {/* Clerk Sign-In Component */}
                        <SignIn
                            routing="hash"
                            afterSignInUrl="/"
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
