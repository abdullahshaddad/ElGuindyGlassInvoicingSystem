import { FiAlertCircle, FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";
import React from "react";

export const ConfirmationDialog = ({
                                       isOpen,
                                       onClose,
                                       onConfirm,
                                       title = 'تأكيد الإجراء',
                                       message = 'هل أنت متأكد من أنك تريد المتابعة؟',
                                       confirmText = 'تأكيد',
                                       cancelText = 'إلغاء',
                                       type = 'warning'
                                   }) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    // Icon configuration by type
    const iconConfig = {
        warning: {
            icon: FiAlertTriangle,
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            buttonColor: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600'
        },
        danger: {
            icon: FiAlertCircle,
            bgColor: 'bg-red-100 dark:bg-red-900/20',
            iconColor: 'text-red-600 dark:text-red-400',
            buttonColor: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
        },
        info: {
            icon: FiInfo,
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
            buttonColor: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
        }
    };

    const config = iconConfig[type] || iconConfig.warning;
    const Icon = config.icon;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
            dir="rtl"
        >
            <div
                className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h2>
                    <button
                        className="rounded-md p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={onClose}
                        aria-label="إغلاق"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}>
                            <Icon className={config.iconColor} size={24} />
                        </div>

                        {/* Message */}
                        <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-2">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-colors"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 transition-colors ${config.buttonColor}`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};