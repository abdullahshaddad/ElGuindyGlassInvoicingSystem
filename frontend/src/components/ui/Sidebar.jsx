// src/components/Sidebar.jsx
import React from 'react';
import clsx from 'clsx';

const SidebarItem = ({
                         children,
                         active = false,
                         onClick,
                         href,
                         className = '',
                         icon,
                         badge,
                         ...props
                     }) => {
    const baseClasses = clsx(
        'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        {
            'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300': active,
            'text-gray-700 dark:text-gray-300': !active,
        },
        className
    );

    const content = (
        <>
            {icon && <span className="ml-3 rtl:ml-0 rtl:mr-3">{icon}</span>}
            <span className="flex-1">{children}</span>
            {badge && (
                <span className="ml-auto rtl:ml-0 rtl:mr-auto bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-primary-900 dark:text-primary-300">
          {badge}
        </span>
            )}
        </>
    );

    if (href) {
        return (
            <a href={href} className={baseClasses} {...props}>
                {content}
            </a>
        );
    }

    return (
        <button type="button" onClick={onClick} className={baseClasses} {...props}>
            {content}
        </button>
    );
};

const SidebarSection = ({ title, children, className = '' }) => (
    <div className={clsx('mb-6', className)}>
        {title && (
            <h3 className="px-4 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                {title}
            </h3>
        )}
        <nav className="space-y-1">{children}</nav>
    </div>
);

const Sidebar = ({
                     isOpen = true,
                     onClose,
                     children,
                     className = '',
                     dir,
                     overlay = true,
                     header,
                     footer,
                     width = 'w-64',
                     ...props
                 }) => {
    return (
        <>
            {/* Overlay for mobile */}
            {overlay && isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <div
                className={clsx(
                    'fixed inset-y-0 right-0 z-50 flex flex-col bg-white dark:bg-gray-900',
                    'border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out',
                    'lg:translate-x-0 lg:static lg:inset-0',
                    width,
                    {
                        'translate-x-0': isOpen,
                        'translate-x-full': !isOpen,
                    },
                    className
                )}
                dir={dir}
                role="navigation"
                aria-label="Sidebar navigation"
                {...props}
            >
                {/* Header */}
                {header && (
                    <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                        {header}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                        {footer}
                    </div>
                )}
            </div>
        </>
    );
};

// Export both components
Sidebar.Item = SidebarItem;
Sidebar.Section = SidebarSection;

export default Sidebar;