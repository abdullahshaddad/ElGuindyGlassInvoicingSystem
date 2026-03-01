// src/components/Select.jsx
import React from 'react';
import clsx from 'clsx';

const Select = ({
                    options = [],
                    value,
                    onChange,
                    disabled = false,
                    error = false,
                    helperText,
                    label,
                    placeholder,
                    required = false,
                    className = '',
                    dir,
                    id,
                    name,
                    children,
                    ...props
                }) => {
    const selectId = id || name || `select-${Math.random().toString(36).substr(2, 9)}`;

    const selectClasses = clsx(
        'w-full px-3 py-2 border rounded-lg transition-colors duration-200',
        'bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-1',
        'text-gray-900 dark:text-white',
        'disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-gray-600 dark:disabled:bg-gray-700',
        'appearance-none cursor-pointer',
        {
            'border-gray-300 focus:border-primary-500 focus:ring-primary-500': !error,
            'border-red-500 focus:border-red-500 focus:ring-red-500': error,
        }
    );

    return (
        <div className={clsx('space-y-1', className)} dir={dir}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    {label}
                    {required && (
                        <span className="text-red-500 ml-1" aria-label="required">*</span>
                    )}
                </label>
            )}

            <div className="relative">
                <select
                    id={selectId}
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    className={selectClasses}
                    aria-invalid={error}
                    aria-describedby={helperText ? `${selectId}-helper` : undefined}
                    {...props}
                >
                    {/* Placeholder */}
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}

                    {/* options=[] prop */}
                    {options.length > 0 &&
                        options.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}

                    {/* children options */}
                    {children}
                </select>

                {/* Arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                        className="h-4 w-4 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            </div>

            {helperText && (
                <p
                    id={`${selectId}-helper`}
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

export default Select;
