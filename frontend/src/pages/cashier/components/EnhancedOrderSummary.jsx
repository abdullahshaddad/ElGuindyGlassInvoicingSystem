import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiInfo } from 'react-icons/fi';
import { FaCalculator } from 'react-icons/fa';

const EnhancedOrderSummary = ({ cart, glassTypes, className = "" }) => {
    const [showBreakdown, setShowBreakdown] = useState(false);

    // Calculate detailed totals
    const totals = cart.reduce((acc, item) => {
        const glassType = glassTypes?.find(gt => gt.id == item.glassTypeId) || item.glassType;
        if (!glassType) return acc;

        const area = (item.width * item.height) / 1000000;
        const length = Math.max(item.width, item.height) / 1000;
        const calculationMethod = glassType.calculationMethod || 'AREA';
        const quantityForPricing = calculationMethod === 'LENGTH' ? length : area;

        const glassUnitPrice = parseFloat(glassType.pricePerMeter || 0);
        const glassTotal = quantityForPricing * glassUnitPrice;

        let cuttingPrice = 0;
        if (item.cuttingType === 'LASER' && item.manualCuttingPrice) {
            cuttingPrice = parseFloat(item.manualCuttingPrice);
        } else {
            const basePrice = item.cuttingType === 'LASER' ? 50 : 25;
            cuttingPrice = quantityForPricing * basePrice;
        }

        return {
            glassTotal: acc.glassTotal + glassTotal,
            cuttingTotal: acc.cuttingTotal + cuttingPrice,
            subtotal: acc.subtotal + glassTotal + cuttingPrice,
            items: acc.items + 1
        };
    }, { glassTotal: 0, cuttingTotal: 0, subtotal: 0, items: 0 });

    // Calculate tax (14% in Egypt)
    const taxRate = 0.14;
    const tax = totals.subtotal * taxRate;
    const total = totals.subtotal + tax;

    const formatCurrency = (amount) => `${parseFloat(amount || 0).toFixed(2)} ج.م`;

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <FaCalculator className="text-emerald-600" size={20}/>
                        </div>
                        ملخص الطلب
                        {totals.items > 0 && (
                            <span className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1 rounded-full border border-emerald-200">
                                {totals.items} عنصر
                            </span>
                        )}
                    </h3>

                    {totals.items > 0 && (
                        <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            {showBreakdown ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                    )}
                </div>
            </div>

            {/* Totals */}
            <div className="p-4">
                {totals.items === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-3">
                            <FaCalculator size={32} className="text-gray-300"/>
                        </div>
                        <p className="font-medium">لا توجد عناصر للحساب</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Detailed breakdown */}
                        {showBreakdown && (
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>تكلفة الزجاج:</span>
                                    <span className="font-mono text-emerald-600">
                                        {formatCurrency(totals.glassTotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>تكلفة القطع:</span>
                                    <span className="font-mono text-orange-600">
                                        {formatCurrency(totals.cuttingTotal)}
                                    </span>
                                </div>
                                <div className="border-t border-gray-200 pt-2">
                                    <div className="flex justify-between text-gray-900 font-medium">
                                        <span>المجموع الفرعي:</span>
                                        <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary totals */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>المجموع الفرعي:</span>
                                <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
                            </div>

                            <div className="flex justify-between text-gray-600">
                                <span>الضريبة ({(taxRate * 100).toFixed(0)}%):</span>
                                <span className="font-mono">{formatCurrency(tax)}</span>
                            </div>

                            <div className="border-t border-gray-200 pt-3">
                                <div className="flex justify-between text-xl font-bold text-gray-900">
                                    <span>الإجمالي:</span>
                                    <span className="text-emerald-600 font-mono bg-emerald-50 px-3 py-1 rounded-lg">
                                        {formatCurrency(total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment breakdown suggestion */}
                        {total > 500 && (
                            <div className="bg-blue-50 rounded-lg p-3 mt-4">
                                <div className="text-sm text-blue-700">
                                    <div className="font-medium mb-1 flex items-center gap-1">
                                        <FiInfo size={14} />
                                        اقتراحات الدفع:
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div>• دفع نقدي: {formatCurrency(total)}</div>
                                        <div>• دفع مقدم 50%: {formatCurrency(total * 0.5)}</div>
                                        <div>• دفع على دفعتين: {formatCurrency(total * 0.6)} + {formatCurrency(total * 0.4)}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedOrderSummary;