import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    FiChevronDown,
    FiChevronUp,
    FiInfo,
    FiTrash2,
    FiCreditCard,
    FiTrendingUp
} from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { invoiceService } from '@/services/invoiceService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { convertToMeters, DIMENSION_UNITS } from '@/utils/dimensionUtils';

const PricingBreakdown = ({ item, glassTypes, isDetailed = false, onRemove, onUpdate, className = "" }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [calculations, setCalculations] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Find glass type details
    const glassType = glassTypes?.find(gt => gt.id == item.glassTypeId) || item.glassType;

    // Fetch backend preview or use local cart data
    useEffect(() => {
        const fetchPreview = async () => {
            // Case 1: Item has pre-calculated data (e.g. from Cart)
            if (item.lineTotal !== undefined && item.operations) {
                const dimUnit = item.dimensionUnit || 'MM';
                const multiplier = dimUnit === 'MM' ? 0.001 : dimUnit === 'CM' ? 0.01 : 1;
                const wM = item.width * multiplier;
                const hM = item.height * multiplier;
                const perim = 2 * (wM + hM); // Rough estimate

                setCalculations({
                    lineTotal: item.lineTotal,
                    glassPrice: item.glassPrice,
                    cuttingPrice: item.operationsPrice, // total operations price
                    width: wM,
                    height: hM,
                    areaM2: item.areaM2,
                    perimeter: perim,
                    quantityForPricing: item.areaM2,
                    glassUnitPrice: item.glassType?.pricePerMeter || 0,
                    quantityUnit: 'م²', // Assuming area
                    operations: item.operations // Pass full operations
                });
                return;
            }

            // Case 2: Legacy/Single operation fetch from backend
            // [Existing logic for fetching preview]
            // UPDATED: Support both old cuttingType and new shatafType/farmaType fields
            const hasOldFields = item.cuttingType;
            const hasNewFields = item.shatafType;

            if (!item.glassTypeId || !item.width || !item.height || (!hasOldFields && !hasNewFields)) {
                setCalculations(null);
                return;
            }

            // Validate manual price for manual types
            if (hasOldFields && item.cuttingType === 'LASER' && !item.manualCuttingPrice) {
                setCalculations(null);
                return;
            }
            const manualShatafTypes = ['LASER', 'ROTATION', 'TABLEAUX'];
            if (hasNewFields && manualShatafTypes.includes(item.shatafType) && !item.manualCuttingPrice) {
                setCalculations(null);
                return;
            }

            // Validate diameter for WHEEL_CUT farma type
            if (hasNewFields && item.farmaType === 'WHEEL_CUT' && !item.diameter) {
                setCalculations(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const preview = await invoiceService.previewLineCalculation({
                    glassTypeId: item.glassTypeId,
                    width: parseFloat(item.width),
                    height: parseFloat(item.height),
                    dimensionUnit: item.dimensionUnit || 'MM',
                    shatafType: item.shatafType || (item.cuttingType === 'LASER' ? 'LASER' : 'KHARAZAN'),
                    farmaType: item.farmaType || 'NORMAL_SHATAF',
                    diameter: item.diameter ? parseFloat(item.diameter) : null,
                    manualCuttingPrice: item.manualCuttingPrice ? parseFloat(item.manualCuttingPrice) : null
                });

                setCalculations(preview);
            } catch (err) {
                console.error('Preview calculation error:', err);
                setError('فشل في حساب المعاينة');
                setCalculations(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPreview();
    }, [item, item.glassTypeId, item.width, item.height, item.cuttingType, item.manualCuttingPrice, item.dimensionUnit]);

    if (!glassType) return null;

    // Format currency
    const formatCurrency = (amount) => `${parseFloat(amount || 0).toFixed(2)} ج.م`;

    return (
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
            {/* Compact view */}
            <div
                className={`p-3 ${isDetailed ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
                onClick={() => isDetailed && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">{glassType.name}</h4>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.width} × {item.height} {item.dimensionUnit || 'MM'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                {calculations?.operations ? (
                                    // Multi-operation badges
                                    <div className="flex flex-wrap gap-1">
                                        {calculations.operations.map((op, idx) => (
                                            <span key={idx} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                                {op.type === 'SHATAF' ? 'شطف' : op.type === 'LASER' ? 'ليزر' : 'فرما'}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                        {item.cuttingType === 'SHATF' ? 'شطف' : item.cuttingType === 'LASER' ? 'ليزر' : 'شطف'}
                                    </span>
                                )}
                                {glassType.thickness && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {glassType.thickness} مم
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <LoadingSpinner size="sm" />
                                <span>جاري الحساب...</span>
                            </div>
                        ) : error ? (
                            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                        ) : calculations && calculations.lineTotal !== undefined ? (
                            <div className="text-left">
                                <div className="font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(calculations.lineTotal)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    زجاج: {formatCurrency(calculations.glassPrice)} +
                                    عمليات: {formatCurrency(calculations.cuttingPrice)}
                                </div>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">لم يتم الحساب</span>
                        )}

                        {isDetailed && (
                            <>
                                {onRemove && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemove(item.id);
                                        }}
                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        <FiTrash2 size={16} />
                                    </Button>
                                )}
                                {isExpanded ? <FiChevronUp className="text-gray-500 dark:text-gray-400" /> : <FiChevronDown className="text-gray-500 dark:text-gray-400" />}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed breakdown - only shown when expanded */}
            {isDetailed && isExpanded && calculations && calculations.lineTotal !== undefined && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="space-y-3">
                        {/* Dimensions & Quantity */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <FiInfo className="text-blue-600 dark:text-blue-400" />
                                <span className="font-medium text-sm text-gray-900 dark:text-white">المقاسات والكمية</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                                <div className="flex justify-between">
                                    <span>الأبعاد:</span>
                                    <span className="font-mono">{calculations.width.toFixed(3)} × {calculations.height.toFixed(3)} متر</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>المساحة:</span>
                                    <span className="font-mono">{calculations.areaM2.toFixed(3)} م²</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>المحيط (تقريبي):</span>
                                    <span className="font-mono">{calculations.perimeter.toFixed(3)} متر</span>
                                </div>
                            </div>
                        </div>

                        {/* Glass Price */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <FiCreditCard className="text-emerald-600 dark:text-emerald-400" />
                                <span className="font-medium text-sm text-emerald-900 dark:text-emerald-100">سعر الزجاج</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                                <div className="flex justify-between">
                                    <span>السعر:</span>
                                    <span className="font-mono">{formatCurrency(calculations.glassUnitPrice)}/وحدة</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>الكمية:</span>
                                    <span className="font-mono">{calculations.quantityForPricing.toFixed(3)}</span>
                                </div>
                                <div className="border-t border-emerald-200 dark:border-emerald-800 pt-1">
                                    <div className="flex justify-between font-medium text-emerald-800 dark:text-emerald-200">
                                        <span>الإجمالي:</span>
                                        <span className="font-mono">{formatCurrency(calculations.glassPrice)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Operations Price (Replaces Cutting Price) */}
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <FiTrendingUp className="text-orange-600 dark:text-orange-400" />
                                <span className="font-medium text-sm text-orange-900 dark:text-orange-100">تفاصيل العمليات</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                                {calculations.operations ? (
                                    // New Operations List
                                    calculations.operations.map((op, idx) => (
                                        <div key={idx} className="flex justify-between py-1 border-b border-orange-100 dark:border-orange-800 last:border-0">
                                            <span>
                                                {op.type === 'SHATAF' && `شطف: ${op.shatafType}`}
                                                {op.type === 'FARMA' && `فارمة: ${op.farmaType}`}
                                                {op.type === 'LASER' && `ليزر: ${op.laserType}`}
                                                {op.diameter && ` (Ø ${op.diameter})`}
                                            </span>
                                            <span className="font-mono">{formatCurrency(op.calculatedPrice || op.manualPrice || op.manualCuttingPrice)}</span>
                                        </div>
                                    ))
                                ) : (
                                    // Legacy Single Cutting
                                    <>
                                        <div className="flex justify-between">
                                            <span>نوع القطع:</span>
                                            <span>{calculations.cuttingType === 'SHATF' ? 'شطف' : 'ليزر'}</span>
                                        </div>
                                        {calculations.cuttingType === 'SHATF' && calculations.cuttingRate && (
                                            <div className="flex justify-between">
                                                <span>السعر:</span>
                                                <span className="font-mono">{formatCurrency(calculations.cuttingRate)}/متر</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="border-t border-orange-200 dark:border-orange-800 pt-1 mt-1">
                                    <div className="flex justify-between font-medium text-orange-800 dark:text-orange-200">
                                        <span>إجمالي العمليات:</span>
                                        <span className="font-mono">{formatCurrency(calculations.cuttingPrice)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Final Total */}
                        <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="grid grid-cols-3 gap-4 text-xs">
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">زجاج</div>
                                    <div className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                                        {formatCurrency(calculations.glassPrice)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">عمليات</div>
                                    <div className="font-mono text-orange-600 dark:text-orange-400 font-medium">
                                        {formatCurrency(calculations.cuttingPrice)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">المجموع</div>
                                    <div className="font-mono font-bold text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(calculations.lineTotal)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingBreakdown;