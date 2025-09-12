import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';

const Layout = ({ children }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 rtl">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content area */}
            <div
                className={clsx(
                    'transition-all duration-300 ease-in-out',
                    'lg:mr-64' // Right margin for RTL sidebar
                )}
            >
                {/* Header */}
                <Header onMenuClick={toggleSidebar} />

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