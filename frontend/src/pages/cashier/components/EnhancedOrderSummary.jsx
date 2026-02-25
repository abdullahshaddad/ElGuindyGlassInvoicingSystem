import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiChevronUp, FiInfo } from 'react-icons/fi';
import { FaCalculator } from 'react-icons/fa';

const EnhancedOrderSummary = ({ cart, glassTypes, className = "" }) => {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const { t } = useTranslation();

    // Calculate detailed totals using backend-calculated prices
    const totals = cart.reduce((acc, item) => {
        const qty = item.quantity || 1;
        const glassPrice = (item.glassPrice || 0) * qty;
        const operationsPrice = (item.operationsPrice || item.cuttingPrice || 0) * qty;
        const lineTotal = item.lineTotal || (glassPrice + operationsPrice);

        return {
            glassTotal: acc.glassTotal + glassPrice,
            cuttingTotal: acc.cuttingTotal + operationsPrice,
            total: acc.total + lineTotal,
            itemCount: acc.itemCount + qty
        };
    }, {
        glassTotal: 0,
        cuttingTotal: 0,
        total: 0,
        itemCount: 0
    });

    const formatCurrency = (amount) => `${parseFloat(amount || 0).toFixed(2)} ${t('common.currency')}`;

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <FaCalculator className="text-emerald-600 dark:text-emerald-400" size={20} />
                        </div>
                        {t('orderSummary.title')}
                        {totals.itemCount > 0 && (
                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-sm px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-700">
                                {totals.itemCount} {t('orderSummary.item')}
                            </span>
                        )}
                    </h3>

                    {totals.itemCount > 0 && (
                        <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            {showBreakdown ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                    )}
                </div>
            </div>

            {/* Totals */}
            <div className="p-4">
                {totals.itemCount === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-full w-fit mx-auto mb-3">
                            <FaCalculator size={32} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="font-medium">{t('orderSummary.noItemsToCalculate')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Detailed breakdown */}
                        {showBreakdown && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                    <span>{t('orderSummary.glassCost')}</span>
                                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(totals.glassTotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                    <span>{t('orderSummary.operationsCost')}</span>
                                    <span className="font-mono text-orange-600 dark:text-orange-400">
                                        {formatCurrency(totals.cuttingTotal)}
                                    </span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                                    <div className="flex justify-between text-gray-900 dark:text-white font-medium">
                                        <span>{t('orderSummary.subtotal')}</span>
                                        <span className="font-mono">{formatCurrency(totals.total)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary totals */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                <span>{t('orderSummary.subtotal')}</span>
                                <span className="font-mono">{formatCurrency(totals.total)}</span>
                            </div>

                            <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                <span>{t('orderSummary.tax')}</span>
                                <span className="font-mono">{formatCurrency(0)}</span>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                                    <span>{t('orderSummary.total')}</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg">
                                        {formatCurrency(totals.total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Backend calculation notice */}
                        <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-800 dark:text-blue-300">
                            <FiInfo className="mt-0.5 flex-shrink-0" size={14} />
                            <span>
                                {t('orderSummary.backendNote')}
                            </span>
                        </div>

                        {/* Payment breakdown suggestion */}
                        {totals.total > 500 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-4">
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <div className="font-medium mb-1 flex items-center gap-1">
                                        <FiInfo size={14} />
                                        {t('orderSummary.paymentSuggestions')}
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div>• {t('payment.methods.CASH')}: {formatCurrency(totals.total)}</div>
                                        <div>• 50%: {formatCurrency(totals.total * 0.5)}</div>
                                        <div>• 60/40: {formatCurrency(totals.total * 0.6)} + {formatCurrency(totals.total * 0.4)}</div>
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