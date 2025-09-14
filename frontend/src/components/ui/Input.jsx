// src/components/Input.jsx
import React from 'react';
import clsx from 'clsx';

const Input = ({
                   type = 'text',
                   placeholder,
                   value,
                   onChange,
                   disabled = false,
                   error = false,
                   helperText,
                   label,
                   required = false,
                   className = '',
                   dir,
                   id,
                   name,
                   ...props
               }) => {
    const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputClasses = clsx(
        'w-full px-3 py-2 border rounded-lg transition-colors duration-200',
        'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
        'disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
        'dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-500',
        'dark:disabled:bg-gray-700',
        {
            'border-gray-300 focus:border-primary-500 focus:ring-primary-500': !error,
            'border-red-500 focus:border-red-500 focus:ring-red-500': error,
        }
    );

    return (
        <div className={clsx('space-y-1', className)} dir={dir}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    {label}
                    {required && (
                        <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
                    )}
                </label>
            )}

            <input
                type={type}
                id={inputId}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={inputClasses}
                aria-invalid={error}
                aria-describedby={helperText ? `${inputId}-helper` : undefined}
                {...props}
            />

            {helperText && (
                <p
                    id={`${inputId}-helper`}
                    className={clsx(
                        'text-sm',
                        error ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'
                    )}
                >
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default Input;