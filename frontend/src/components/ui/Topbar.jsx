// src/components/Topbar.jsx
import React from 'react';
import clsx from 'clsx';

const Topbar = ({
                    children,
                    logo,
                    navigation,
                    actions,
                    menuButton,
                    className = '',
                    dir,
                    sticky = true,
                    ...props
                }) => {
    return (
        <header
            className={clsx(
                'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700',
                sticky && 'sticky top-0 z-40',
                className
            )}
            dir={dir}
            role="banner"
            {...props}
        >
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left section (Logo + Menu button) */}
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        {/* Mobile menu button */}
                        {menuButton && (
                            <button
                                type="button"
                                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                aria-label="Open sidebar"
                            >
                                {menuButton}
                            </button>
                        )}

                        {/* Logo */}
                        {logo && (
                            <div className="flex-shrink-0">
                                {logo}
                            </div>
                        )}
                    </div>

                    {/* Center section (Navigation) */}
                    {navigation && (
                        <nav className="hidden lg:flex items-center space-x-8 rtl:space-x-reverse">
                            {navigation}
                        </nav>
                    )}

                    {/* Right section (Actions) */}
                    {actions && (
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            {actions}
                        </div>
                    )}

                    {/* Custom children content */}
                    {children}
                </div>
            </div>
        </header>
    );
};

export default Topbar;