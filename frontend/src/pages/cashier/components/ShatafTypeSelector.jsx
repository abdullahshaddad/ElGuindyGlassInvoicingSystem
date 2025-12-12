import React from 'react';
import { FiScissors, FiEdit3, FiSquare, FiCircle } from 'react-icons/fi';
import Select from '@components/ui/Select.jsx';
import Badge from '@components/ui/Badge.jsx';
import { SHATAF_TYPES, SHATAF_CATEGORIES } from '@/constants/shatafTypes.js';

/**
 * ShatafTypeSelector Component
 * Displays all 10 shataf types with category badges and descriptions
 */
const ShatafTypeSelector = ({
                                value,
                                onChange,
                                disabled = false,
                                error = null,
                                showDescription = true,
                                className = ''
                            }) => {
    const selectedType = value ? SHATAF_TYPES[value] : null;

    // Get icon based on category
    const getCategoryIcon = (category) => {
        switch (category) {
            case SHATAF_CATEGORIES.FORMULA_BASED:
                return <FiScissors className="text-blue-600 dark:text-blue-400" />;
            case SHATAF_CATEGORIES.MANUAL_INPUT:
                return <FiEdit3 className="text-purple-600 dark:text-purple-400" />;
            case SHATAF_CATEGORIES.AREA_BASED:
                return <FiSquare className="text-green-600 dark:text-green-400" />;
            default:
                return <FiScissors />;
        }
    };

    // Get category description
    const getCategoryDescription = (category) => {
        switch (category) {
            case SHATAF_CATEGORIES.FORMULA_BASED:
                return 'يحسب تلقائياً حسب السمك والأبعاد';
            case SHATAF_CATEGORIES.MANUAL_INPUT:
                return 'يتطلب إدخال يدوي للسعر';
            case SHATAF_CATEGORIES.AREA_BASED:
                return 'يحسب حسب المساحة والسعر لكل متر مربع';
            default:
                return '';
        }
    };

    // Get category badge variant
    const getCategoryBadgeVariant = (category) => {
        switch (category) {
            case SHATAF_CATEGORIES.FORMULA_BASED:
                return 'info';
            case SHATAF_CATEGORIES.MANUAL_INPUT:
                return 'warning';
            case SHATAF_CATEGORIES.AREA_BASED:
                return 'success';
            default:
                return 'default';
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                نوع الشطف
                <span className="text-red-500 mr-1">*</span>
            </label>

            {/* Dropdown Selection */}
            <Select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                error={error}
                icon={<FiScissors />}
            >
                <option value="">-- اختر نوع الشطف --</option>

                {/* Formula-Based Types */}
                <optgroup label="─── أنواع الشطف (حساب تلقائي) ───">
                    <option value="KHARAZAN">خرازان</option>
                    <option value="SHAMBORLEH">شمبورليه</option>
                    <option value="ONE_CM">1 سم</option>
                    <option value="TWO_CM">2 سم</option>
                    <option value="THREE_CM">3 سم</option>
                    <option value="JULIA">جوليا</option>
                </optgroup>

                {/* Manual Input Types */}
                <optgroup label="─── أنواع يدوية ───">
                    <option value="LASER">ليزر (إدخال يدوي)</option>
                    <option value="ROTATION">دوران (إدخال يدوي)</option>
                    <option value="TABLEAUX">تابلوهات (إدخال يدوي)</option>
                </optgroup>

                {/* Area-Based Type */}
                <optgroup label="─── حساب حسب المساحة ───">
                    <option value="SANDING">صنفرة (حسب المتر المربع)</option>
                </optgroup>
            </Select>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {error}
                </p>
            )}

            {/* Selected Type Info */}
            {selectedType && showDescription && (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {getCategoryIcon(selectedType.category)}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {selectedType.arabicName}
                            </span>
                        </div>
                        <Badge
                            variant={getCategoryBadgeVariant(selectedType.category)}
                            className="text-xs"
                        >
                            {selectedType.category === SHATAF_CATEGORIES.FORMULA_BASED && 'حساب تلقائي'}
                            {selectedType.category === SHATAF_CATEGORIES.MANUAL_INPUT && 'إدخال يدوي'}
                            {selectedType.category === SHATAF_CATEGORIES.AREA_BASED && 'حسب المساحة'}
                        </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {getCategoryDescription(selectedType.category)}
                    </p>

                    {/* Additional Info Based on Type */}
                    <div className="text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {selectedType.requiresThicknessRate && !selectedType.usesAreaCalculation && (
                            <div className="flex items-center gap-1">
                                <FiCircle size={8} className="text-blue-500" />
                                <span>يعتمد على سعر السمك المحدد</span>
                            </div>
                        )}
                        {selectedType.requiresManualPrice && (
                            <div className="flex items-center gap-1">
                                <FiCircle size={8} className="text-purple-500" />
                                <span>يجب إدخال السعر يدوياً</span>
                            </div>
                        )}
                        {selectedType.usesAreaCalculation && (
                            <div className="flex items-center gap-1">
                                <FiCircle size={8} className="text-green-500" />
                                <span>يحسب بضرب المساحة × السعر للمتر المربع</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShatafTypeSelector;