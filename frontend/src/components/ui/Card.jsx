import React from 'react';
import clsx from 'clsx';

/**
 * Professional Card Component
 */
const Card = ({
                  children,
                  className,
                  variant = 'default',
                  padding = 'default',
                  shadow = 'default',
                  ...props
              }) => {
    const variantClasses = {
        default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600',
        elevated: 'bg-white dark:bg-gray-800 border-0',
        gradient: 'bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-900 border border-primary-200 dark:border-gray-700',
    };

    const paddingClasses = {
        none: 'p-0',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
    };

    const shadowClasses = {
        none: 'shadow-none',
        sm: 'shadow-sm',
        default: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
    };

    return (
        <div
            className={clsx(
                'rounded-xl transition-all duration-200',
                variantClasses[variant],
                paddingClasses[padding],
                shadowClasses[shadow],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

/**
 * Card Header Component
 */
export const CardHeader = ({
                               children,
                               className,
                               action,
                               ...props
                           }) => {
    return (
        <div
            className={clsx(
                'flex items-center justify-between',
                className
            )}
            {...props}
        >
            <div className="flex-1">
                {children}
            </div>
            {action && (
                <div className="ml-4">
                    {action}
                </div>
            )}
        </div>
    );
};

/**
 * Card Title Component
 */
export const CardTitle = ({
                              children,
                              className,
                              size = 'default',
                              ...props
                          }) => {
    const sizeClasses = {
        sm: 'text-base',
        default: 'text-lg',
        lg: 'text-xl',
        xl: 'text-2xl',
    };

    return (
        <h3
            className={clsx(
                'font-semibold text-gray-900 dark:text-white',
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {children}
        </h3>
    );
};

/**
 * Card Description Component
 */
export const CardDescription = ({
                                    children,
                                    className,
                                    ...props
                                }) => {
    return (
        <p
            className={clsx(
                'text-gray-600 dark:text-gray-400 mt-1',
                className
            )}
            {...props}
        >
            {children}
        </p>
    );
};

/**
 * Card Content Component
 */
export const CardContent = ({
                                children,
                                className,
                                ...props
                            }) => {
    return (
        <div
            className={clsx(
                'mt-4',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

/**
 * Card Footer Component
 */
export const CardFooter = ({
                               children,
                               className,
                               divided = false,
                               ...props
                           }) => {
    return (
        <div
            className={clsx(
                'mt-6',
                divided && 'pt-6 border-t border-gray-200 dark:border-gray-700',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

/**
 * Stats Card Component
 */
export const StatsCard = ({
                              title,
                              value,
                              change,
                              icon: IconComponent,
                              trend = 'neutral',
                              className,
                              ...props
                          }) => {
    const trendClasses = {
        up: 'text-green-600 dark:text-green-400',
        down: 'text-red-600 dark:text-red-400',
        neutral: 'text-gray-600 dark:text-gray-400',
    };

    return (
        <Card className={clsx('hover:shadow-md transition-shadow', className)} {...props}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </p>
                    {change !== undefined && (
                        <p className={clsx('text-sm font-medium mt-1', trendClasses[trend])}>
                            {change > 0 ? '+' : ''}{change}%
                        </p>
                    )}
                </div>
                {IconComponent && (
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                )}
            </div>
        </Card>
    );
};

export default Card;