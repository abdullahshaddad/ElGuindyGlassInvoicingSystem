import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FiChevronDown,
    FiChevronUp,
    FiInfo,
    FiTrash2,
    FiCreditCard,
    FiTrendingUp
} from 'react-icons/fi';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { BEVELING_TYPES } from '@/constants/bevelingTypes.js';

/**
 * Resolve a display name for an operation.
 * Works with:
 *   - Cart item internal format: { bevelingType: 'KHARZAN', calcMethod: 'STRAIGHT', ... }
 *   - Backend DB format: { operationType: { code, ar, en }, calculationMethod?: { code, ar, en }, price }
 *   - Backend preview format: { operationTypeCode, calculationMethodCode, calculatedPrice }
 */
const getOperationLabel = (op) => {
    // Backend DB format (embedded bilingual labels)
    if (op.operationType?.ar) return op.operationType.ar;
    // Backend preview format
    if (op.operationTypeCode) return BEVELING_TYPES[op.operationTypeCode]?.arabicName || op.operationTypeCode;
    // Cart internal format
    if (op.bevelingType) return BEVELING_TYPES[op.bevelingType]?.arabicName || op.bevelingType;
    return '—';
};

const getOperationPrice = (op) =>
    op.calculatedPrice ?? op.price ?? op.manualPrice ?? 0;

const PricingBreakdown = ({ item, glassTypes, isDetailed = false, onRemove, onUpdate, className = "" }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);

    const glassType = glassTypes?.find(gt => (gt._id || gt.id) == item.glassTypeId) || item.glassType;

    // Cart items always have pre-calculated data
    const hasPreCalcData = item.lineTotal !== undefined;

    const calculations = useMemo(() => {
        if (!hasPreCalcData) return null;

        const dimUnit = item.dimensionUnit || 'CM';
        const multiplier = dimUnit === 'MM' ? 0.001 : dimUnit === 'CM' ? 0.01 : 1;
        const wM = item.width * multiplier;
        const hM = item.height * multiplier;
        const perim = 2 * (wM + hM);
        const preview = item.backendPreview;

        return {
            lineTotal: item.lineTotal,
            glassPrice: item.glassPrice,
            operationsPrice: item.operationsPrice ?? 0,
            width: wM,
            height: hM,
            areaM2: item.areaM2,
            perimeter: perim,
            quantityForPricing: preview?.quantityForPricing ?? item.areaM2,
            glassUnitPrice: preview?.glassUnitPrice ?? glassType?.pricePerMeter ?? 0,
            pricingMethod: preview?.pricingMethod ?? 'AREA',
            quantityUnit: preview?.pricingMethod === 'LENGTH' ? t('common.meter') : t('common.squareMeter'),
            quantity: item.quantity || 1,
            operations: preview?.operationsPreviews ?? item.operations ?? [],
        };
    }, [hasPreCalcData, item]);

    if (!glassType) return null;

    const formatCurrency = (amount) => `${parseFloat(amount || 0).toFixed(2)} ${t('common.currency')}`;

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
                                    {item.width} × {item.height} {item.dimensionUnit || 'CM'}
                                    {item.quantity > 1 && ` × ${item.quantity}`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                {calculations?.operations?.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {calculations.operations.map((op, idx) => (
                                            <span key={idx} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                                {getOperationLabel(op)}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400">{t('product.noOperationsYet')}</span>
                                )}
                                {glassType.thickness && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {glassType.thickness} {t('common.mm')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {calculations && calculations.lineTotal !== undefined ? (
                            <div className="text-left">
                                <div className="font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(calculations.lineTotal)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('pricing.glassColon')} {formatCurrency(calculations.glassPrice)} +
                                    {t('pricing.operationsColon')} {formatCurrency(calculations.operationsPrice)}
                                </div>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">{t('pricing.notCalculated')}</span>
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

            {/* Detailed breakdown */}
            {isDetailed && isExpanded && calculations && calculations.lineTotal !== undefined && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="space-y-3">
                        {/* Dimensions */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <FiInfo className="text-blue-600 dark:text-blue-400" />
                                <span className="font-medium text-sm text-gray-900 dark:text-white">{t('pricing.dimensionsAndQuantity')}</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                                {calculations.width && (
                                    <div className="flex justify-between">
                                        <span>{t('pricing.dimensions')}</span>
                                        <span className="font-mono">{calculations.width.toFixed(3)} × {calculations.height.toFixed(3)} {t('pricing.meter')}</span>
                                    </div>
                                )}
                                {calculations.areaM2 && (
                                    <div className="flex justify-between">
                                        <span>{t('pricing.area')}</span>
                                        <span className="font-mono">{calculations.areaM2.toFixed(3)} {t('common.squareMeter')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Glass Price */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <FiCreditCard className="text-emerald-600 dark:text-emerald-400" />
                                <span className="font-medium text-sm text-emerald-900 dark:text-emerald-100">{t('pricing.glassPrice')}</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                                {calculations.glassUnitPrice !== undefined && (
                                    <div className="flex justify-between">
                                        <span>{t('pricing.price')}</span>
                                        <span className="font-mono">{formatCurrency(calculations.glassUnitPrice)}{t('pricing.perUnit')}</span>
                                    </div>
                                )}
                                {calculations.quantity > 1 && (
                                    <div className="flex justify-between">
                                        <span>{t('pricing.quantity')}</span>
                                        <span className="font-mono">{calculations.quantity} {t('invoices.details.piece')}</span>
                                    </div>
                                )}
                                <div className="border-t border-emerald-200 dark:border-emerald-800 pt-1">
                                    <div className="flex justify-between font-medium text-emerald-800 dark:text-emerald-200">
                                        <span>{t('pricing.total')}</span>
                                        <span className="font-mono">{formatCurrency(calculations.glassPrice)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Operations Price */}
                        {calculations.operations.length > 0 && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiTrendingUp className="text-orange-600 dark:text-orange-400" />
                                    <span className="font-medium text-sm text-orange-900 dark:text-orange-100">{t('pricing.operationDetails')}</span>
                                </div>
                                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                                    {calculations.operations.map((op, idx) => (
                                        <div key={idx} className="flex justify-between py-1 border-b border-orange-100 dark:border-orange-800 last:border-0">
                                            <span>{getOperationLabel(op)}</span>
                                            <span className="font-mono">{formatCurrency(getOperationPrice(op))}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-orange-200 dark:border-orange-800 pt-1 mt-1">
                                        <div className="flex justify-between font-medium text-orange-800 dark:text-orange-200">
                                            <span>{t('pricing.operationsTotal')}</span>
                                            <span className="font-mono">{formatCurrency(calculations.operationsPrice)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Final Total */}
                        <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="grid grid-cols-3 gap-4 text-xs">
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">{t('pricing.glass')}</div>
                                    <div className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                                        {formatCurrency(calculations.glassPrice)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">{t('pricing.operations')}</div>
                                    <div className="font-mono text-orange-600 dark:text-orange-400 font-medium">
                                        {formatCurrency(calculations.operationsPrice)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">{t('pricing.totalLabel')}</div>
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
