// src/components/Badge.jsx
import React from 'react';
import clsx from 'clsx';

const Badge = ({
                   children,
                   variant = 'default',
                   size = 'md',
                   className = '',
                   dir,
                   ...props
               }) => {
    const baseClasses = clsx(
        'inline-flex items-center font-medium rounded-full',
        {
            // Sizes
            'px-2 py-0.5 text-xs': size === 'sm',
            'px-2.5 py-0.5 text-sm': size === 'md',
            'px-3 py-1 text-base': size === 'lg',

            // Variants
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100': variant === 'default',
            'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100': variant === 'primary',
            'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-100': variant === 'secondary',
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100': variant === 'success',
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100': variant === 'warning',
            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100': variant === 'danger',
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100': variant === 'info',

            // Outline variants
            'bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300': variant === 'outline',
            'bg-transparent border border-primary-300 text-primary-700 dark:border-primary-600 dark:text-primary-300': variant === 'outline-primary',
            'bg-transparent border border-green-300 text-green-700 dark:border-green-600 dark:text-green-300': variant === 'outline-success',
            'bg-transparent border border-yellow-300 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300': variant === 'outline-warning',
            'bg-transparent border border-red-300 text-red-700 dark:border-red-600 dark:text-red-300': variant === 'outline-danger',
        }
    );

    return (
        <span
            className={clsx(baseClasses, className)}
            dir={dir}
            {...props}
        >
      {children}
    </span>
    );
};

export default Badge;