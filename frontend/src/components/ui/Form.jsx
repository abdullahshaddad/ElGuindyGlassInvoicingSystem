import React from 'react';
import clsx from 'clsx';
import { FiEye, FiEyeOff, FiAlertCircle, FiCheck } from 'react-icons/fi';

/**
 * Form Field Wrapper
 */
export const FormField = ({
                              children,
                              label,
                              error,
                              required = false,
                              className,
                              description,
                              ...props
                          }) => {
    return (
        <div className={clsx('space-y-2', className)} {...props}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {description}
                </p>
            )}
            {children}
            {error && (
                <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                    <FiAlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
};

/**
 * Input Component
 */
export const Input = React.forwardRef(({
                                           type = 'text',
                                           className,
                                           error,
                                           success,
                                           leftIcon: LeftIcon,
                                           rightIcon: RightIcon,
                                           ...props
                                       }, ref) => {
    const baseClasses = 'block w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const stateClasses = error
        ? 'border-red-300 dark:border-red-600 text-red-900 dark:text-red-100 placeholder-red-300 dark:placeholder-red-400 focus:ring-red-500 focus:border-red-500'
        : success
            ? 'border-green-300 dark:border-green-600 text-green-900 dark:text-green-100 focus:ring-green-500 focus:border-green-500'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500';

    const paddingClasses = LeftIcon && RightIcon
        ? 'px-10 py-3'
        : LeftIcon
            ? 'pl-10 pr-4 py-3'
            : RightIcon
                ? 'pr-10 pl-4 py-3'
                : 'px-4 py-3';

    return (
        <div className="relative">
            {LeftIcon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LeftIcon className="w-5 h-5 text-gray-400" />
                </div>
            )}

            <input
                ref={ref}
                type={type}
                className={clsx(
                    baseClasses,
                    stateClasses,
                    paddingClasses,
                    className
                )}
                {...props}
            />

            {RightIcon && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <RightIcon className="w-5 h-5 text-gray-400" />
                </div>
            )}

            {success && !RightIcon && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiCheck className="w-5 h-5 text-green-500" />
                </div>
            )}
        </div>
    );
});

Input.displayName = 'Input';

/**
 * Password Input Component
 */
export const PasswordInput = React.forwardRef(({
                                                   className,
                                                   ...props
                                               }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
        <div className="relative">
            <Input
                ref={ref}
                type={showPassword ? 'text' : 'password'}
                className={className}
                {...props}
            />
            <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
            >
                {showPassword ? (
                    <FiEyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                ) : (
                    <FiEye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                )}
            </button>
        </div>
    );
});

PasswordInput.displayName = 'PasswordInput';

/**
 * Textarea Component
 */
export const Textarea = React.forwardRef(({
                                              className,
                                              error,
                                              success,
                                              rows = 4,
                                              ...props
                                          }, ref) => {
    const baseClasses = 'block w-full rounded-lg border px-4 py-3 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed resize-vertical';

    const stateClasses = error
        ? 'border-red-300 dark:border-red-600 text-red-900 dark:text-red-100 placeholder-red-300 dark:placeholder-red-400 focus:ring-red-500 focus:border-red-500'
        : success
            ? 'border-green-300 dark:border-green-600 text-green-900 dark:text-green-100 focus:ring-green-500 focus:border-green-500'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500';

    return (
        <textarea
            ref={ref}
            rows={rows}
            className={clsx(
                baseClasses,
                stateClasses,
                className
            )}
            {...props}
        />
    );
});

Textarea.displayName = 'Textarea';

/**
 * Select Component
 */
export const Select = React.forwardRef(({
                                            children,
                                            className,
                                            error,
                                            success,
                                            placeholder,
                                            ...props
                                        }, ref) => {
    const baseClasses = 'block w-full rounded-lg border px-4 py-3 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-no-repeat bg-right bg-select-arrow';

    const stateClasses = error
        ? 'border-red-300 dark:border-red-600 text-red-900 dark:text-red-100 focus:ring-red-500 focus:border-red-500'
        : success
            ? 'border-green-300 dark:border-green-600 text-green-900 dark:text-green-100 focus:ring-green-500 focus:border-green-500'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500';

    return (
        <select
            ref={ref}
            className={clsx(
                baseClasses,
                stateClasses,
                className
            )}
            {...props}
        >
            {placeholder && (
                <option value="" disabled>
                    {placeholder}
                </option>
            )}
            {children}
        </select>
    );
});

Select.displayName = 'Select';

/**
 * Checkbox Component
 */
export const Checkbox = React.forwardRef(({
                                              label,
                                              description,
                                              className,
                                              error,
                                              ...props
                                          }, ref) => {
    return (
        <div className={clsx('flex items-start', className)}>
            <div className="flex items-center h-5">
                <input
                    ref={ref}
                    type="checkbox"
                    className={clsx(
                        'w-4 h-4 rounded border transition-colors duration-200 focus:ring-2 focus:ring-offset-2',
                        error
                            ? 'border-red-300 text-red-600 focus:ring-red-500'
                            : 'border-gray-300 text-primary-600 focus:ring-primary-500',
                        'dark:border-gray-600 dark:bg-gray-800'
                    )}
                    {...props}
                />
            </div>
            {(label || description) && (
                <div className="mr-3 text-sm">
                    {label && (
                        <label className="font-medium text-gray-700 dark:text-gray-300">
                            {label}
                        </label>
                    )}
                    {description && (
                        <p className="text-gray-500 dark:text-gray-400">
                            {description}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
});

Checkbox.displayName = 'Checkbox';

/**
 * Radio Component
 */
export const Radio = React.forwardRef(({
                                           label,
                                           description,
                                           className,
                                           error,
                                           ...props
                                       }, ref) => {
    return (
        <div className={clsx('flex items-start', className)}>
            <div className="flex items-center h-5">
                <input
                    ref={ref}
                    type="radio"
                    className={clsx(
                        'w-4 h-4 border transition-colors duration-200 focus:ring-2 focus:ring-offset-2',
                        error
                            ? 'border-red-300 text-red-600 focus:ring-red-500'
                            : 'border-gray-300 text-primary-600 focus:ring-primary-500',
                        'dark:border-gray-600 dark:bg-gray-800'
                    )}
                    {...props}
                />
            </div>
            {(label || description) && (
                <div className="mr-3 text-sm">
                    {label && (
                        <label className="font-medium text-gray-700 dark:text-gray-300">
                            {label}
                        </label>
                    )}
                    {description && (
                        <p className="text-gray-500 dark:text-gray-400">
                            {description}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
});

Radio.displayName = 'Radio';

/**
 * Form Group Component for radio buttons
 */
export const RadioGroup = ({
                               children,
                               className,
                               label,
                               error,
                               required = false,
                               ...props
                           }) => {
    return (
        <fieldset className={clsx('space-y-3', className)} {...props}>
            {label && (
                <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </legend>
            )}
            <div className="space-y-2">
                {children}
            </div>
            {error && (
                <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                    <FiAlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </fieldset>
    );
};

export default {
    FormField,
    Input,
    PasswordInput,
    Textarea,
    Select,
    Checkbox,
    Radio,
    RadioGroup
};