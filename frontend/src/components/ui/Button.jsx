import React from 'react';
import clsx from 'clsx';
import { FiLoader } from 'react-icons/fi';

/**
 * Professional Button Component
 */
const Button = ({
                    children,
                    variant = 'primary',
                    size = 'md',
                    disabled = false,
                    loading = false,
                    leftIcon: LeftIcon,
                    rightIcon: RightIcon,
                    className,
                    type = 'button',
                    ...props
                }) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
        secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
        outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-primary-500',
        ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-primary-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    };

    const sizeClasses = {
        xs: 'px-2.5 py-1.5 text-xs',
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg',
    };

    const iconSizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
        xl: 'w-6 h-6',
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={clsx(
                baseClasses,
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {loading && (
                <FiLoader className={clsx('animate-spin', iconSizeClasses[size], 'mr-2')} />
            )}

            {!loading && LeftIcon && (
                <LeftIcon className={clsx(iconSizeClasses[size], children ? 'mr-2' : '')} />
            )}

            {children}

            {!loading && RightIcon && (
                <RightIcon className={clsx(iconSizeClasses[size], children ? 'ml-2' : '')} />
            )}
        </button>
    );
};

/**
 * Icon Button Component for icon-only buttons
 */
export const IconButton = ({
                               icon: IconComponent,
                               size = 'md',
                               variant = 'ghost',
                               className,
                               'aria-label': ariaLabel,
                               title,
                               ...props
                           }) => {
    const sizeClasses = {
        xs: 'p-1',
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-3',
        xl: 'p-4',
    };

    const iconSizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8',
    };

    return (
        <Button
            variant={variant}
            className={clsx(sizeClasses[size], 'rounded-full', className)}
            aria-label={ariaLabel}
            title={title}
            {...props}
        >
            <IconComponent className={iconSizeClasses[size]} />
        </Button>
    );
};

/**
 * Button Group Component
 */
export const ButtonGroup = ({ children, className, ...props }) => {
    return (
        <div
            className={clsx(
                'inline-flex rounded-lg shadow-sm',
                '[&>button:not(:first-child)]:rounded-l-none',
                '[&>button:not(:last-child)]:rounded-r-none',
                '[&>button:not(:first-child)]:border-l-0',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export default Button;