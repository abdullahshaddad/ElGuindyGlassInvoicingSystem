// src/components/Button.jsx
import React from 'react';
import clsx from 'clsx';

const Button = ({
                    children,
                    variant = 'primary',
                    size = 'md',
                    disabled = false,
                    loading = false,
                    className = '',
                    dir,
                    type = 'button',
                    onClick,
                    ...props
                }) => {
    const baseClasses = clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
            // Sizes
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',

            // Variants
            'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500': variant === 'primary',
            'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500': variant === 'secondary',
            'bg-white text-primary-500 border border-primary-500 hover:bg-primary-50 focus:ring-primary-500': variant === 'outline',
            'bg-transparent text-primary-500 hover:bg-primary-50 focus:ring-primary-500': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500': variant === 'danger',
            'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500': variant === 'success',
        }
    );

    return (
        <button
            type={type}
            className={clsx(baseClasses, className)}
            disabled={disabled || loading}
            onClick={onClick}
            dir={dir}
            aria-busy={loading}
            aria-disabled={disabled}
            {...props}
        >
            {loading && (
                <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
};

export default Button;