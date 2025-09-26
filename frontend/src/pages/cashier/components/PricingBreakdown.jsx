import React, { useState } from 'react';
import {
    FiChevronDown,
    FiChevronUp,
    FiInfo,
    FiTrash2,
    FiCreditCard,
    FiTrendingUp
} from 'react-icons/fi';
import Button from '@/components/ui/Button';

const PricingBreakdown = ({ item, glassTypes, isDetailed = false, onRemove, onUpdate, className = "" }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Find glass type details
    const glassType = glassTypes?.find(gt => gt.id == item.glassTypeId) || item.glassType;

    if (!glassType) return null;

    // Calculate detailed breakdown
    const calculations = {
        // Area/Length calculations
        area: (item.width * item.height) / 1000000, // Convert mm² to m²
        length: Math.max(item.width, item.height) / 1000, // Convert mm to m for length-based

        // Determine calculation method
        calculationMethod: glassType.calculationMethod || 'AREA',

        // Get quantity for pricing
        get quantityForPricing() {
            return this.calculationMethod === 'LENGTH' ? this.length : this.area;
        },

        // Glass price calculation
        get glassUnitPrice() {
            return parseFloat(glassType.pricePerMeter || 0);
        },

        get glassTotal() {
            return this.quantityForPricing * this.glassUnitPrice;
        },

        // Cutting price calculation
        get cuttingPrice() {
            if (item.cuttingType === 'LASER' && item.manualCuttingPrice) {
                return parseFloat(item.manualCuttingPrice);
            }

            // Auto-calculated cutting price based on type
            const basePrice = item.cuttingType === 'LASER' ? 50 : 25; // Example base prices
            return this.quantityForPricing * basePrice;
        },

        // Line total
        get lineTotal() {
            return this.glassTotal + this.cuttingPrice;
        }
    };

    // Format currency
    const formatCurrency = (amount) => `${parseFloat(amount || 0).toFixed(2)} ج.م`;

    // Format quantity with unit
    const formatQuantity = (quantity, method) => {
        if (method === 'LENGTH') {
            return `${quantity.toFixed(3)} متر طولي`;
        }
        return `${quantity.toFixed(3)} متر مربع`;
    };

    return (
        <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
            {/* Compact view */}
            <div
                className={`p-3 ${isDetailed ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                onClick={() => isDetailed && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                            {glassType.nameArabic || glassType.name}
                        </div>
                        <div className="text-xs text-gray-500 space-x-2 space-x-reverse mt-1">
                            <span>سمك {glassType.thickness}مم</span>
                            <span>•</span>
                            <span className="font-mono">{item.width} × {item.height} مم</span>
                            <span>•</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                                item.cuttingType === 'SHATF'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-orange-100 text-orange-700'
                            }`}>
                                {item.cuttingType === 'SHATF' ? 'شطف' : 'ليزر'}
                            </span>
                        </div>
                    </div>

                    <div className="text-left flex items-center gap-2">
                        <div>
                            <div className="text-base font-bold text-emerald-600">
                                {formatCurrency(calculations.lineTotal)}
                            </div>
                            <div className="text-xs text-gray-500">
                                {formatQuantity(calculations.quantityForPricing, calculations.calculationMethod)}
                            </div>
                        </div>

                        {onRemove && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(item.id);
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                            >
                                <FiTrash2 size={14}/>
                            </Button>
                        )}

                        {isDetailed && (
                            <button
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed breakdown */}
            {isExpanded && (
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                    <div className="space-y-3">
                        {/* Calculation Method Info */}
                        <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <FiInfo className="text-blue-600" size={14} />
                                <span className="text-xs font-medium text-blue-900">
                                    طريقة الحساب
                                </span>
                            </div>
                            <div className="text-xs text-blue-700">
                                {calculations.calculationMethod === 'LENGTH' ? (
                                    <>
                                        <div>حساب بالطول: يتم استخدام البعد الأطول</div>
                                        <div className="font-mono mt-1">
                                            الطول = max({item.width}, {item.height}) = {(calculations.length * 1000).toFixed(0)} مم = {calculations.length.toFixed(3)} متر
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>حساب بالمساحة: العرض × الارتفاع</div>
                                        <div className="font-mono mt-1">
                                            المساحة = {item.width} × {item.height} = {(calculations.area * 1000000).toFixed(0)} مم² = {calculations.area.toFixed(3)} م²
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Glass Cost */}
                            <div className="bg-emerald-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiCreditCard className="text-emerald-600" size={14} />
                                    <span className="text-xs font-medium text-emerald-900">
                                        تكلفة الزجاج
                                    </span>
                                </div>
                                <div className="space-y-1 text-xs text-emerald-700">
                                    <div className="flex justify-between">
                                        <span>سعر المتر:</span>
                                        <span className="font-mono">{formatCurrency(calculations.glassUnitPrice)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>الكمية:</span>
                                        <span className="font-mono">{calculations.quantityForPricing.toFixed(3)}</span>
                                    </div>
                                    <div className="border-t border-emerald-200 pt-1">
                                        <div className="flex justify-between font-medium">
                                            <span>الإجمالي:</span>
                                            <span className="font-mono">{formatCurrency(calculations.glassTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cutting Cost */}
                            <div className="bg-orange-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiTrendingUp className="text-orange-600" size={14} />
                                    <span className="text-xs font-medium text-orange-900">
                                        تكلفة القطع
                                    </span>
                                </div>
                                <div className="space-y-1 text-xs text-orange-700">
                                    <div className="flex justify-between">
                                        <span>نوع القطع:</span>
                                        <span>{item.cuttingType === 'SHATF' ? 'شطف' : 'ليزر'}</span>
                                    </div>
                                    {item.cuttingType === 'LASER' && item.manualCuttingPrice ? (
                                        <div className="flex justify-between">
                                            <span>سعر يدوي:</span>
                                            <span className="font-mono">{formatCurrency(item.manualCuttingPrice)}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between">
                                                <span>سعر القطع:</span>
                                                <span className="font-mono">{item.cuttingType === 'LASER' ? '50' : '25'} ج.م/وحدة</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>الكمية:</span>
                                                <span className="font-mono">{calculations.quantityForPricing.toFixed(3)}</span>
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
                        </div>

                        {/* Final Total */}
                        <div className="bg-gray-100 rounded-lg p-3">
                            <div className="grid grid-cols-3 gap-4 text-xs">
                                <div className="text-center">
                                    <div className="text-gray-500">زجاج</div>
                                    <div className="font-mono text-emerald-600 font-medium">
                                        {formatCurrency(calculations.glassTotal)}
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingBreakdown;