import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext.jsx';
import clsx from 'clsx';
import {
    FiMenu,
    FiSun,
    FiMoon,
    FiBell,
    FiGlobe,
    FiUser
} from 'react-icons/fi';

const Header = ({ onMenuClick }) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ar' ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
    };

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
            <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Left section - Mobile menu button */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            aria-label="فتح القائمة"
                        >
                            <FiMenu className="w-6 h-6" />
                        </button>

                        {/* Page title or breadcrumb can go here */}
                        <div className="hidden lg:block">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {t('navigation.dashboard', 'لوحة التحكم')}
                            </h2>
                        </div>
                    </div>

                    {/* Right section - Actions and user info */}
                    <div className="flex items-center gap-2">
                        {/* Language toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title={t('common.language.toggle')}
                        >
                            <FiGlobe className="w-5 h-5" />
                            <span className="sr-only">
                                {i18n.language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
                            </span>
                        </button>

                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title={t('common.theme.toggle')}
                        >
                            {isDarkMode ? (
                                <FiSun className="w-5 h-5" />
                            ) : (
                                <FiMoon className="w-5 h-5" />
                            )}
                        </button>

                        {/* Notifications */}
                        <button
                            className="relative p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title="الإشعارات"
                        >
                            <FiBell className="w-5 h-5" />
                            {/* Notification badge */}
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                        </button>

                        {/* User profile */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
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
};

export default Header;