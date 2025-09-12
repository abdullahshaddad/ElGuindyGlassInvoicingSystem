import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';

const Header = ({ onMenuClick }) => {
    const {t, i18n} = useTranslation();
    const {user} = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.classList.contains('dark')
    );

    const toggleLanguage = () => {
        const currentLang = i18n.language;
        const newLang = currentLang === 'ar' ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
    };

    const toggleTheme = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);

        if (newDarkMode) {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
        }
    };

    const getCurrentTime = () => {
        return new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(new Date());
    };

    const getCurrentDate = () => {
        return new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(new Date());
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 lg:px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left side - Menu button and breadcrumb */}
                    <div className="flex items-center gap-4">
                        {/* Mobile menu button */}
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="فتح القائمة"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>

                        {/* Date and time */}
                        <div className="hidden md:flex flex-col">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {getCurrentDate()}
              </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                {getCurrentTime()}
              </span>
                        </div>
                    </div>

                    {/* Right side - Controls */}
                    <div className="flex items-center gap-3">
                        {/* Language toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title={t('common.language.toggle')}
                        >
              <span className="text-sm font-medium">
                {i18n.language === 'ar' ? 'EN' : 'عر'}
              </span>
                        </button>

                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title={t('common.theme.toggle')}
                        >
                            {isDarkMode ? '☀️' : '🌙'}
                        </button>

                        {/* Notifications (placeholder) */}
                        <button
                            className="relative p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title="الإشعارات"
                        >
                            🔔
                            {/* Notification badge */}
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                        </button>

                        {/* User profile */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                            <div
                                className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                            </div>
                            <div className="hidden sm:block text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">
                                    {user?.displayName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {user?.role === 'OWNER' && 'مالك'}
                                    {user?.role === 'CASHIER' && 'كاشير'}
                                    {user?.role === 'WORKER' && 'عامل'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
export default Header