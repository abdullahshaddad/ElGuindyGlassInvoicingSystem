import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import SuperAdminBanner from './SuperAdminBanner';
import { useAuth } from '@/contexts/AuthContext';
import { FiMenu } from 'react-icons/fi';
import clsx from 'clsx';

const Layout = ({ children }) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        // Initialize from localStorage
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved === 'true';
    });

    const isRTL = i18n.language === 'ar';

    // Persist sidebar collapsed state
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
    }, [sidebarCollapsed]);

    const toggleSidebarCollapse = () => {
        setSidebarCollapsed(prev => !prev);
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={toggleSidebarCollapse}
            />

            {/* Main content area */}
            <div
                className={clsx(
                    'transition-all duration-300 ease-in-out min-h-screen',
                    // Margin based on language direction and collapsed state
                    isRTL
                        ? (sidebarCollapsed ? 'lg:mr-20' : 'lg:mr-64')
                        : (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')
                )}
            >
                {/* Mobile menu button */}
                <div className={clsx(
                    'lg:hidden fixed top-4 z-30',
                    isRTL ? 'right-4' : 'left-4'
                )}>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <FiMenu size={24} />
                    </button>
                </div>

                {/* SuperAdmin viewing banner */}
                <SuperAdminBanner />

                {/* Page content */}
                <main className="p-4 lg:p-6">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
        </div>
    );
};

export default Layout;