import React from 'react';
import clsx from 'clsx';
import { FiSearch } from 'react-icons/fi';

/**
 * SearchInput — search input with an inline icon using flex layout.
 * Flex automatically places the icon on the start side (left in LTR, right in RTL).
 */
const SearchInput = ({
    value,
    onChange,
    placeholder,
    className = '',
    wrapperClassName = '',
    disabled = false,
    id,
    name,
    ...props
}) => {
    const inputId = id || name || undefined;

    return (
        <div className={clsx(
            'flex items-center gap-2 px-3 border rounded-lg transition-colors duration-200',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            'focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500',
            disabled && 'bg-gray-50 cursor-not-allowed opacity-50 dark:bg-gray-700',
            wrapperClassName
        )}>
            <FiSearch
                className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0"
                aria-hidden="true"
            />
            <input
                type="text"
                id={inputId}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className={clsx(
                    'flex-1 min-w-0 py-2 bg-transparent border-none outline-none',
                    'text-gray-900 dark:text-white',
                    'placeholder-gray-400 dark:placeholder-gray-500',
                    'disabled:cursor-not-allowed',
                    className
                )}
                {...props}
            />
        </div>
    );
};

export default SearchInput;
