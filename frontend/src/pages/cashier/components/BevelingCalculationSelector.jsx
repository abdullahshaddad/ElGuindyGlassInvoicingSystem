import React, { useEffect, useState } from 'react';
import { FiGrid, FiInfo } from 'react-icons/fi';
import Select from '@components/ui/Select.jsx';
import Badge from '@components/ui/Badge.jsx';
import { BEVELING_CALCULATIONS } from '@/constants/bevelingCalculations.js';
import { calculateBevelingMeters } from '@/utils/bevelingUtils.js';

/**
 * BevelingCalculationSelector Component
 * Displays all calculation method types with formula preview and auto-calculation
 */
const BevelingCalculationSelector = ({
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

    const selectedCalculation = value ? BEVELING_CALCULATIONS[value] : null;

    // Recalculate when dimensions or calculation type change
    useEffect(() => {
        if (!selectedCalculation || selectedCalculation.isManual) {
            setCalculatedMeters(null);
            setCalculationError(null);
            return;
        }

        try {
            const widthM = width ? width / 1000 : 0;
            const heightM = height ? height / 1000 : 0;
            const diameterM = diameter ? diameter / 1000 : null;

            if (widthM > 0 && heightM > 0) {
                const meters = calculateBevelingMeters(value, widthM, heightM, diameterM);
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
    }, [value, width, height, diameter, selectedCalculation]);

    return (
        <div className={`space-y-2 ${className}`}>

            <Select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                error={error}
                icon={<FiGrid />}
            >
                <option value="">-- اختر طريقة الحساب --</option>

                {/* Straight */}
                <option value="STRAIGHT">عدل (شطف عادي)</option>

                {/* Head Frame Types */}
                <optgroup label="─── فارمة رأس ───">
                    <option value="FRAME_HEAD">رأس فارمة</option>
                    <option value="2_FRAME_HEADS">2 رأس فارمة</option>
                </optgroup>

                {/* Side Frame Types */}
                <optgroup label="─── فارمة جنب ───">
                    <option value="FRAME_SIDE">جنب فارمة</option>
                    <option value="2_FRAME_SIDES">2 جنب فارمة</option>
                </optgroup>

                {/* Combined Frame Types */}
                <optgroup label="─── فارمة مركبة ───">
                    <option value="FRAME_HEAD_SIDE">رأس + جنب</option>
                    <option value="2_FRAME_HEADS_SIDE">2 رأس + جنب</option>
                    <option value="2_FRAME_SIDES_HEAD">2 جنب + رأس</option>
                    <option value="FULL_FRAME">فارمة كاملة</option>
                </optgroup>

                {/* Special Types */}
                <optgroup label="─── أنواع خاصة ───">
                    <option value="CIRCLE">عجلة</option>
                    <option value="CURVE_ARCH">دوران (يدوي)</option>
                    <option value="PANELS">تابلوهات (يدوي)</option>
                </optgroup>
            </Select>

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
            )}

            {selectedCalculation && (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FiGrid className="text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {selectedCalculation.arabicName}
                            </span>
                        </div>
                        <Badge variant={selectedCalculation.isManual ? 'warning' : 'info'} className="text-xs">
                            {selectedCalculation.isManual ? 'يدوي' : 'تلقائي'}
                        </Badge>
                    </div>

                    {!selectedCalculation.isManual && selectedCalculation.formula && (
                        <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded p-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">المعادلة:</p>
                            <p className="text-sm font-mono text-blue-700 dark:text-blue-300 text-left" dir="ltr">
                                {selectedCalculation.formula}
                            </p>
                        </div>
                    )}

                    {showCalculationPreview && !selectedCalculation.isManual && (
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
                                    <p className="text-xs text-red-700 dark:text-red-300">{calculationError}</p>
                                </div>
                            ) : (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-2">
                                    <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                                        <FiInfo size={14} />
                                        <span className="text-xs">أدخل الأبعاد لحساب عدد الأمتار</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedCalculation.isManual && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-2">
                            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                                <FiInfo size={14} />
                                <span className="text-xs">هذا النوع يتطلب إدخال القيمة يدوياً</span>
                            </div>
                        </div>
                    )}

                    {selectedCalculation.requiresDiameter && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                                <FiInfo size={14} />
                                <span className="text-xs">هذا النوع يتطلب إدخال القطر</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BevelingCalculationSelector;
