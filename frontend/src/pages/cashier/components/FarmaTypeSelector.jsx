import React, { useEffect, useState } from 'react';
import { FiGrid, FiInfo } from 'react-icons/fi';
import Select from '@components/ui/Select.jsx';
import Badge from '@components/ui/Badge.jsx';
import { FARMA_TYPES } from '@/constants/farmaTypes.js';
import { calculateFarmaMeters } from '@/utils/farmaUtils.js';

/**
 * FarmaTypeSelector Component
 * Displays all 12 farma types with formula preview and auto-calculation
 */
const FarmaTypeSelector = ({
                               value,
                               onChange,
                               width,
                               height,
                               diameter,
                               disabled = false,
                               error = null,
                               showCalculationPreview = true,
                               className = ''
                           }) => {
    const [calculatedMeters, setCalculatedMeters] = useState(null);
    const [calculationError, setCalculationError] = useState(null);

    const selectedFarma = value ? FARMA_TYPES[value] : null;

    // Recalculate when dimensions or farma type change
    useEffect(() => {
        if (!selectedFarma || selectedFarma.isManual) {
            setCalculatedMeters(null);
            setCalculationError(null);
            return;
        }

        try {
            // Convert dimensions to meters for calculation
            const widthM = width ? width / 1000 : 0;
            const heightM = height ? height / 1000 : 0;
            const diameterM = diameter ? diameter / 1000 : null;

            if (widthM > 0 && heightM > 0) {
                const meters = calculateFarmaMeters(value, widthM, heightM, diameterM);
                setCalculatedMeters(meters);
                setCalculationError(null);
            } else {
                setCalculatedMeters(null);
                setCalculationError(null);
            }
        } catch (err) {
            setCalculatedMeters(null);
            setCalculationError(err.message);
        }
    }, [value, width, height, diameter, selectedFarma]);

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                نوع الفارمة
                <span className="text-red-500 mr-1">*</span>
            </label>

            {/* Dropdown Selection */}
            <Select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                error={error}
                icon={<FiGrid />}
            >
                <option value="">-- اختر نوع الفارمة --</option>

                {/* Normal Shataf */}
                <option value="NORMAL_SHATAF">شطف عادي</option>

                {/* Head Farma Types */}
                <optgroup label="─── فارمة رأس ───">
                    <option value="ONE_HEAD_FARMA">رأس فارمة</option>
                    <option value="TWO_HEAD_FARMA">2 رأس فارمة</option>
                </optgroup>

                {/* Side Farma Types */}
                <optgroup label="─── فارمة جنب ───">
                    <option value="ONE_SIDE_FARMA">جنب فارمة</option>
                    <option value="TWO_SIDE_FARMA">2 جنب فارمة</option>
                </optgroup>

                {/* Combined Farma Types */}
                <optgroup label="─── فارمة مركبة ───">
                    <option value="HEAD_SIDE_FARMA">رأس + جنب</option>
                    <option value="TWO_HEAD_ONE_SIDE_FARMA">2 رأس + جنب</option>
                    <option value="TWO_SIDE_ONE_HEAD_FARMA">2 جنب + رأس</option>
                    <option value="FULL_FARMA">فارمة كاملة</option>
                </optgroup>

                {/* Special Types */}
                <optgroup label="─── أنواع خاصة ───">
                    <option value="WHEEL_CUT">عجلة</option>
                    <option value="ROTATION">دوران (يدوي)</option>
                    <option value="TABLEAUX">تابلوهات (يدوي)</option>
                </optgroup>
            </Select>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {error}
                </p>
            )}

            {/* Selected Farma Info */}
            {selectedFarma && (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FiGrid className="text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {selectedFarma.arabicName}
                            </span>
                        </div>
                        <Badge
                            variant={selectedFarma.isManual ? 'warning' : 'info'}
                            className="text-xs"
                        >
                            {selectedFarma.isManual ? 'يدوي' : 'تلقائي'}
                        </Badge>
                    </div>

                    {/* Formula Display */}
                    {!selectedFarma.isManual && selectedFarma.formula && (
                        <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded p-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">المعادلة:</p>
                            <p className="text-sm font-mono text-blue-700 dark:text-blue-300 text-left" dir="ltr">
                                {selectedFarma.formula}
                            </p>
                        </div>
                    )}

                    {/* Calculation Preview */}
                    {showCalculationPreview && !selectedFarma.isManual && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            {calculatedMeters !== null ? (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-green-700 dark:text-green-300">
                                            عدد الأمتار المحسوبة:
                                        </span>
                                        <span className="text-sm font-bold text-green-800 dark:text-green-200 font-mono">
                                            {calculatedMeters.toFixed(2)} متر
                                        </span>
                                    </div>
                                </div>
                            ) : calculationError ? (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                                    <p className="text-xs text-red-700 dark:text-red-300">
                                        {calculationError}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-2">
                                    <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                                        <FiInfo size={14} />
                                        <span className="text-xs">
                                            أدخل الأبعاد لحساب عدد الأمتار
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Manual Type Info */}
                    {selectedFarma.isManual && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-2">
                            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                                <FiInfo size={14} />
                                <span className="text-xs">
                                    هذا النوع يتطلب إدخال القيمة يدوياً
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Diameter Required Notice */}
                    {selectedFarma.requiresDiameter && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                                <FiInfo size={14} />
                                <span className="text-xs">
                                    هذا النوع يتطلب إدخال القطر
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FarmaTypeSelector;