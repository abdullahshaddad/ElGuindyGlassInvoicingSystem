import React from 'react';
import { FiUser, FiUsers, FiDollarSign } from 'react-icons/fi';
import Select from './Select';

/**
 * Customer Type Selector Component
 * Allows selection between CASH, REGULAR, and COMPANY customer types
 * with visual indicators and descriptions
 */
const CustomerTypeSelector = ({
    value,
    onChange,
    disabled = false,
    error = null,
    showDescription = true
}) => {
    const customerTypes = [
        {
            value: 'CASH',
            label: 'عميل نقدي',
            icon: FiDollarSign,
            description: 'يدفع كامل المبلغ فوراً، لا يمكن أن يكون له رصيد مستحق',
            color: 'text-green-600 dark:text-green-400'
        },
        {
            value: 'REGULAR',
            label: 'عميل',
            icon: FiUser,
            description: 'يمكنه الدفع جزئياً أو لاحقاً، يتم تتبع الرصيد المستحق',
            color: 'text-blue-600 dark:text-blue-400'
        },
        {
            value: 'COMPANY',
            label: 'شركة',
            icon: FiUsers,
            description: 'شركة أو مؤسسة، يمكن أن يكون لها فواتير متعددة غير مدفوعة',
            color: 'text-purple-600 dark:text-purple-400'
        }
    ];

    const selectedType = customerTypes.find(t => t.value === value);

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                نوع العميل
                <span className="text-red-500 mr-1">*</span>
            </label>

            {/* Dropdown Selection */}
            <Select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                error={!!error}
            >
                <option value="">اختر نوع العميل</option>
                {customerTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    );
                })}
            </Select>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {error}
                </p>
            )}

            {/* Visual Cards for Better UX */}
            {showDescription && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                    {customerTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = value === type.value;

                        return (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => !disabled && onChange(type.value)}
                                disabled={disabled}
                                className={`
                                    p-4 rounded-lg border-2 transition-all text-right
                                    ${isSelected
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                    }
                                    ${!disabled && 'hover:border-primary-300 dark:hover:border-primary-600 cursor-pointer'}
                                    ${disabled && 'opacity-50 cursor-not-allowed'}
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <Icon
                                        size={24}
                                        className={isSelected ? 'text-primary-600 dark:text-primary-400' : type.color}
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900 dark:text-white mb-1">
                                            {type.label}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            {type.description}
                                        </div>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="mt-2 text-xs font-medium text-primary-600 dark:text-primary-400">
                                        محدد
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Selected Type Info (compact view when showDescription is false) */}
            {!showDescription && selectedType && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                    {React.createElement(selectedType.icon, {
                        size: 16,
                        className: selectedType.color
                    })}
                    <span className="text-gray-700 dark:text-gray-300">
                        {selectedType.description}
                    </span>
                </div>
            )}
        </div>
    );
};

export default CustomerTypeSelector;
