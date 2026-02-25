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
        <div className={clsx('mb-6', className)} dir={dir} {...props}>
            {breadcrumbs.length > 0 && (
                <nav className="mb-2" aria-label="Breadcrumb">
                    <ol className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        {breadcrumbs.map((crumb, index) => (
                            <li key={index} className="flex items-center gap-1.5">
                                {index > 0 && (
                                    <span className="text-gray-300 dark:text-gray-600">/</span>
                                )}
                                {crumb.href ? (
                                    <a
                                        href={crumb.href}
                                        className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                                    >
                                        {crumb.label}
                                    </a>
                                ) : (
                                    <span className={clsx(
                                        index === breadcrumbs.length - 1
                                            ? 'text-gray-900 dark:text-white font-medium'
                                            : ''
                                    )}>
                                        {crumb.label}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}

            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                            {subtitle}
                        </p>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
