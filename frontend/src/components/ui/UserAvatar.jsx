import React from 'react';
import { FiUser } from 'react-icons/fi';
import clsx from 'clsx';

const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-sm',
    md: 'w-9 h-9 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg',
};

const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
};

/**
 * User avatar component with initials or icon fallback.
 *
 * @param {Object} props
 * @param {string} [props.firstName]
 * @param {string} [props.lastName]
 * @param {string} [props.username] - Fallback for initials
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [props.size='sm']
 * @param {string} [props.className] - Additional classes
 */
const UserAvatar = ({ firstName, lastName, username, size = 'sm', className }) => {
    const first = firstName?.[0] || '';
    const second = lastName?.[0] || (!first && username?.[0]) || '';
    const initials = (first + second).toUpperCase() || null;

    return (
        <div
            className={clsx(
                'rounded-full flex items-center justify-center font-medium flex-shrink-0',
                'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
                sizeClasses[size] || sizeClasses.sm,
                className
            )}
        >
            {initials || <FiUser size={iconSizes[size] || 14} />}
        </div>
    );
};

export default UserAvatar;
