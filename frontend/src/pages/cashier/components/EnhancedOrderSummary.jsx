import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiInfo } from 'react-icons/fi';
import { FaCalculator } from 'react-icons/fa';

const EnhancedOrderSummary = ({ cart, glassTypes, className = "" }) => {
    const [showBreakdown, setShowBreakdown] = useState(false);

    // Calculate detailed totals using backend-calculated prices
    const totals = cart.reduce((acc, item) => {
        const glassPrice = item.glassPrice || 0;
        const cuttingPrice = item.cuttingPrice || 0;
        const lineTotal = item.lineTotal || 0;

        return {
            glassTotal: acc.glassTotal + glassPrice,
            cuttingTotal: acc.cuttingTotal + cuttingPrice,
            total: acc.total + lineTotal,
            itemCount: acc.itemCount + 1
        };
    }, {
        glassTotal: 0,
        cuttingTotal: 0,
        total: 0,
        itemCount: 0
    });

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
                        {totals.itemCount > 0 && (
                            <span className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1 rounded-full border border-emerald-200">
                                {totals.itemCount} عنصر
                            </span>
                        )}
                    </h3>

                    {totals.itemCount > 0 && (
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
                {totals.itemCount === 0 ? (
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
                                        <span className="font-mono">{formatCurrency(totals.total)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary totals */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>المجموع الفرعي:</span>
                                <span className="font-mono">{formatCurrency(totals.total)}</span>
                            </div>

                            <div className="flex justify-between text-gray-600">
                                <span>الضريبة:</span>
                                <span className="font-mono">0.00 ج.م</span>
                            </div>

                            <div className="border-t border-gray-200 pt-3">
                                <div className="flex justify-between text-xl font-bold text-gray-900">
                                    <span>الإجمالي:</span>
                                    <span className="text-emerald-600 font-mono bg-emerald-50 px-3 py-1 rounded-lg">
                                        {formatCurrency(totals.total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Backend calculation notice */}
                        <div className="flex items-start gap-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                            <FiInfo className="mt-0.5 flex-shrink-0" size={14} />
                            <span>
                                جميع الأسعار محسوبة من الخادم وتطابق الفاتورة النهائية
                            </span>
                        </div>

                        {/* Payment breakdown suggestion */}
                        {totals.total > 500 && (
                            <div className="bg-blue-50 rounded-lg p-3 mt-4">
                                <div className="text-sm text-blue-700">
                                    <div className="font-medium mb-1 flex items-center gap-1">
                                        <FiInfo size={14} />
                                        اقتراحات الدفع:
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div>• دفع نقدي: {formatCurrency(totals.total)}</div>
                                        <div>• دفع مقدم 50%: {formatCurrency(totals.total * 0.5)}</div>
                                        <div>• دفع على دفعتين: {formatCurrency(totals.total * 0.6)} + {formatCurrency(totals.total * 0.4)}</div>
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