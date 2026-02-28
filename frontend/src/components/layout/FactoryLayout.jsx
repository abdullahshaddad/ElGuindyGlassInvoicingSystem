import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext.jsx';
import clsx from 'clsx';
import {
    FiMenu,
    FiX,
    FiLogOut,
    FiSun,
    FiMoon,
    FiGlobe,
    FiScissors,
    FiHome,
    FiUser
} from 'react-icons/fi';

/**
 * Factory Layout - Optimized for factory workers
 * No navbar, only a collapsible sidebar with essential controls
 */
const FactoryLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900" dir="rtl">
            {/* Sidebar */}
            <FactorySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content - No margin on mobile, with margin on desktop for sidebar */}
            <div className="lg:mr-64 min-h-screen">
                {/* Mobile menu button - Fixed at top */}
                <div className="lg:hidden fixed top-4 right-4 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <FiMenu size={24} />
                    </button>
                </div>

                {/* Page content */}
                <Outlet />
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden bg-black/50"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

/**
 * Factory Sidebar - Simplified sidebar for factory workers
 */
const FactorySidebar = ({ isOpen, onClose }) => {
    const { t, i18n } = useTranslation();
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ar' ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
    };

    const handleLogout = async () => {
        await logout();
        onClose();
    };

    // Navigation items for factory workers
    const navItems = [
        {
            to: '/factory',
            icon: FiScissors,
            label: 'شاشة القطع',
            active: isActive('/factory')
        }
    ];

    // Add dashboard link for admins/owners
    if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
        navItems.unshift({
            to: '/dashboard',
            icon: FiHome,
            label: 'لوحة التحكم',
            active: isActive('/dashboard')
        });
    }

    return (
        <aside
            className={clsx(
                'fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700',
                'transform transition-transform duration-300 ease-in-out',
                'flex flex-col',
                'lg:translate-x-0',
                isOpen ? 'translate-x-0' : 'translate-x-full'
            )}
        >
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <FiScissors className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                                شاشة القطع
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                نظام كوارتز
                            </p>
                        </div>
                    </div>

                    {/* Close button - Mobile only */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <FiX size={20} />
                    </button>
                </div>
            </div>


            {/* Navigation */}
            <div className="flex-1 p-4 overflow-y-auto">
                <nav className="space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                                item.active
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            )}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Settings Section */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                    الإعدادات
                </h3>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        {isDarkMode ? <FiMoon size={20} /> : <FiSun size={20} />}
                        <span className="font-medium">
                            {isDarkMode ? 'الوضع الليلي' : 'الوضع النهاري'}
                        </span>
                    </div>
                    <div className={clsx(
                        'w-12 h-7 rounded-full p-1 transition-colors',
                        isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                    )}>
                        <div className={clsx(
                            'w-5 h-5 bg-white rounded-full shadow transition-transform',
                            isDarkMode ? 'translate-x-0' : 'translate-x-5'
                        )} />
                    </div>
                </button>

                {/* Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <FiGlobe size={20} />
                        <span className="font-medium">اللغة</span>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium">
                        {i18n.language === 'ar' ? 'العربية' : 'English'}
                    </span>
                </button>
            </div>

            {/* User Info with Logout */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user?.firstName?.charAt(0) || <FiUser size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                            {user?.displayName || 'مستخدم'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.role === 'WORKER' && 'عامل مصنع'}
                            {user?.role === 'OWNER' && 'مالك'}
                            {user?.role === 'ADMIN' && 'مدير'}
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="تسجيل الخروج"
                    >
                        <FiLogOut size={20} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default FactoryLayout;
