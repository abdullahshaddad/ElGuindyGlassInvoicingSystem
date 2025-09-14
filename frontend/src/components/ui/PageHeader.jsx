// src/components/PageHeader.jsx
import React from 'react';
import clsx from 'clsx';

const PageHeader = ({
                        title,
                        subtitle,
                        breadcrumbs = [],
                        actions,
                        className = '',
                        dir,
                        ...props
                    }) => {
    return (
        <div
            className={clsx(
                'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
                className
            )}
            dir={dir}
            {...props}
        >
            <div className="px-6 py-4">
                {/* Breadcrumbs */}
                {breadcrumbs.length > 0 && (
                    <nav className="mb-3" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                            {breadcrumbs.map((crumb, index) => (
                                <li key={index} className="flex items-center">
                                    {index > 0 && (
                                        <svg
                                            className="w-4 h-4 text-gray-400 mx-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    )}

                                    {crumb.href ? (
                                        <a
                                            href={crumb.href}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                            aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
                                        >
                                            {crumb.label}
                                        </a>
                                    ) : (
                                        <span
                                            className={clsx(
                                                index === breadcrumbs.length - 1
                                                    ? 'text-gray-900 dark:text-white font-medium'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            )}
                                            aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
                                        >
                      {crumb.label}
                    </span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}

                {/* Title and Actions */}
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    {actions && (
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageHeader;