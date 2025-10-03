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

    // Fetch backend preview whenever relevant fields change
    useEffect(() => {
        const fetchPreview = async () => {
            if (!item.glassTypeId || !item.width || !item.height || !item.cuttingType) {
                setCalculations(null);
                return;
            }

            if (item.cuttingType === 'LASER' && !item.manualCuttingPrice) {
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
                    cuttingType: item.cuttingType,
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
    }, [item.glassTypeId, item.width, item.height, item.cuttingType, item.manualCuttingPrice, item.dimensionUnit]);
    if (!glassType) return null;

    // Format currency
    const formatCurrency = (amount) => `${parseFloat(amount || 0).toFixed(2)} ج.م`;

    return (
        <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
            {/* Compact view */}
            <div
                className={`p-3 ${isDetailed ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                onClick={() => isDetailed && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900">{glassType.name}</h4>
                                <span className="text-xs text-gray-500">
                                    {item.width} × {item.height} م
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                    {item.cuttingType === 'SHATF' ? 'شطف' : 'ليزر'}
                                </span>
                                {glassType.thickness && (
                                    <span className="text-xs text-gray-500">
                                        {glassType.thickness} مم
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <LoadingSpinner size="sm" />
                                <span>جاري الحساب...</span>
                            </div>
                        ) : error ? (
                            <span className="text-sm text-red-600">{error}</span>
                        ) : calculations && calculations.lineTotal !== undefined ? (
                            <div className="text-left">
                                <div className="font-bold text-gray-900">
                                    {formatCurrency(calculations.lineTotal)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    زجاج: {formatCurrency(calculations.glassPrice)} +
                                    قطع: {formatCurrency(calculations.cuttingPrice)}
                                </div>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-400">لم يتم الحساب</span>
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
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <FiTrash2 size={16} />
                                    </Button>
                                )}
                                {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed breakdown - only shown when expanded */}
            {isDetailed && isExpanded && calculations && calculations.lineTotal !== undefined && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="space-y-3">
                        {/* Dimensions & Quantity */}
                        <div className="bg-white rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <FiInfo className="text-blue-600" />
                                <span className="font-medium text-sm">المقاسات والكمية</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                                <div className="flex justify-between">
                                    <span>الأبعاد:</span>
                                    <span className="font-mono">{calculations.width} × {calculations.height} متر</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>المساحة:</span>
                                    <span className="font-mono">{calculations.areaM2.toFixed(3)} م²</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>المحيط:</span>
                                    <span className="font-mono">{calculations.perimeter.toFixed(3)} متر</span>
                                </div>
                                <div className="flex justify-between font-medium text-gray-900">
                                    <span>الكمية للتسعير:</span>
                                    <span className="font-mono">
                                        {calculations.quantityForPricing.toFixed(3)} {calculations.quantityUnit}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Glass Price */}
                        <div className="bg-emerald-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <FiCreditCard className="text-emerald-600" />
                                <span className="font-medium text-sm">سعر الزجاج</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                                <div className="flex justify-between">
                                    <span>السعر:</span>
                                    <span className="font-mono">{formatCurrency(calculations.glassUnitPrice)}/وحدة</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>الكمية:</span>
                                    <span className="font-mono">{calculations.quantityForPricing.toFixed(3)}</span>
                                </div>
                                <div className="border-t border-emerald-200 pt-1">
                                    <div className="flex justify-between font-medium">
                                        <span>الإجمالي:</span>
                                        <span className="font-mono">{formatCurrency(calculations.glassPrice)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cutting Price */}
                        <div className="bg-orange-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <FiTrendingUp className="text-orange-600" />
                                <span className="font-medium text-sm">سعر القطع</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                                <div className="flex justify-between">
                                    <span>نوع القطع:</span>
                                    <span>{calculations.cuttingType === 'SHATF' ? 'شطف' : 'ليزر'}</span>
                                </div>
                                {calculations.cuttingType === 'SHATF' && calculations.cuttingRate && (
                                    <>
                                        <div className="flex justify-between">
                                            <span>السعر:</span>
                                            <span className="font-mono">{formatCurrency(calculations.cuttingRate)}/متر</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>المحيط:</span>
                                            <span className="font-mono">{calculations.perimeter.toFixed(3)} متر</span>
                                        </div>
                                    </>
                                )}
                                <div className="border-t border-orange-200 pt-1">
                                    <div className="flex justify-between font-medium">
                                        <span>الإجمالي:</span>
                                        <span className="font-mono">{formatCurrency(calculations.cuttingPrice)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Final Total */}
                        <div className="bg-gray-100 rounded-lg p-3">
                            <div className="grid grid-cols-3 gap-4 text-xs">
                                <div className="text-center">
                                    <div className="text-gray-500">زجاج</div>
                                    <div className="font-mono text-emerald-600 font-medium">
                                        {formatCurrency(calculations.glassPrice)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500">قطع</div>
                                    <div className="font-mono text-orange-600 font-medium">
                                        {formatCurrency(calculations.cuttingPrice)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500">المجموع</div>
                                    <div className="font-mono font-bold text-sm text-gray-900">
                                        {formatCurrency(calculations.lineTotal)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Backend calculation note */}
                        <div className="text-xs text-gray-500 text-center italic">
                            الأسعار محسوبة من الخادم وستكون مطابقة للفاتورة النهائية
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingBreakdown;