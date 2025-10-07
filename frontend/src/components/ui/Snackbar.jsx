import {FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo, FiX} from "react-icons/fi";
import React from "react";

const Snackbar = ({ message, type, onClose }) => {
    const icons = {
        success: FiCheckCircle,
        error: FiAlertCircle,
        info: FiInfo,
        warning: FiAlertTriangle
    };

    const typeStyles = {
        success: 'border-r-green-500 dark:border-r-green-400',
        error: 'border-r-red-500 dark:border-r-red-400',
        info: 'border-r-blue-500 dark:border-r-blue-400',
        warning: 'border-r-amber-500 dark:border-r-amber-400'
    };

    const iconColors = {
        success: 'text-green-500 dark:text-green-400',
        error: 'text-red-500 dark:text-red-400',
        info: 'text-blue-500 dark:text-blue-400',
        warning: 'text-amber-500 dark:text-amber-400'
    };

    const Icon = icons[type] || FiInfo;

    return (
        <div
            className={`
                flex items-center justify-between
                p-4 rounded-lg
                bg-white dark:bg-gray-800
                shadow-lg
                border-r-4 ${typeStyles[type] || typeStyles.info}
                animate-[slideIn_0.3s_ease-out]
                min-w-[320px] max-w-[400px]
            `}
        >
            <div className="flex items-center gap-3 flex-1">
                <Icon
                    className={`
                        w-5 h-5 flex-shrink-0
                        ${iconColors[type] || iconColors.info}
                    `}
                />
                <span className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                    {message}
                </span>
            </div>
            <button
                className="
                    p-1 rounded
                    text-gray-500 dark:text-gray-400
                    hover:bg-gray-100 dark:hover:bg-gray-700
                    transition-colors
                    flex items-center justify-center
                "
                onClick={onClose}
                aria-label="إغلاق"
            >
                <FiX className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Snackbar;