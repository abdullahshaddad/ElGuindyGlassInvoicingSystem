import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { FiMenu } from 'react-icons/fi';
import clsx from 'clsx';

const Layout = ({ children }) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isRTL = i18n.language === 'ar';

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content area */}
            <div
                className={clsx(
                    'transition-all duration-300 ease-in-out min-h-screen',
                    isRTL ? 'lg:mr-64' : 'lg:ml-64' // Margin based on language direction
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