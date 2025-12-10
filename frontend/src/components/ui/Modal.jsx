// src/components/Modal.jsx
import React, { useEffect } from 'react';
import clsx from 'clsx';

const Modal = ({
    isOpen = false,
    onClose,
    children,
    title,
    size = 'md',
    closeOnBackdrop = true,
    closeButton = true,
    footer,
    className = '',
    dir,
    ...props
}) => {
    // Handle escape key press and scroll locking
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen && onClose) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);

            // Prevent body scroll and compensate for scrollbar width
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            // Restore body scroll and padding
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = (event) => {
        if (closeOnBackdrop && event.target === event.currentTarget && onClose) {
            onClose();
        }
    };

    const modalSizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-7xl',
    };

    return (
        <div
            className="fixed inset-0 z-50 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            dir={dir}
            {...props}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div className="flex h-full items-center justify-center p-4">
                <div
                    className={clsx(
                        'relative w-full max-h-[90vh] flex flex-col transform rounded-lg bg-white',
                        'dark:bg-gray-800 shadow-xl transition-all',
                        modalSizes[size],
                        className
                    )}
                >
                    {/* Header */}
                    {(title || closeButton) && (
                        <div className="flex-none flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            {title && (
                                <h3
                                    id="modal-title"
                                    className="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    {title}
                                </h3>
                            )}

                            {closeButton && (
                                <button
                                    type="button"
                                    className="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    onClick={onClose}
                                    aria-label="Close modal"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="flex-none border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;