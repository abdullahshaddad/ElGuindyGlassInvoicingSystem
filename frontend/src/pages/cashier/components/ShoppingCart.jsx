import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiShoppingCart } from 'react-icons/fi';
import PricingBreakdown from './PricingBreakdown';

const ShoppingCart = ({ cart, glassTypes, onRemove, onUpdate }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <FiShoppingCart className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                {t('cart.title')}
                {cart.length > 0 && (
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-sm px-3 py-1 rounded-full border border-purple-200 dark:border-purple-700">
                        {cart.length}
                    </span>
                )}
            </h3>

            {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-full w-fit mx-auto mb-3">
                        <FiShoppingCart size={48} className="text-purple-300 dark:text-purple-700" />
                    </div>
                    <p className="font-medium">{t('cart.empty')}</p>
                    <p className="text-sm">{t('cart.addItemsHint')}</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cart.map((item, index) => (
                        <PricingBreakdown
                            key={item.id}
                            item={item}
                            glassTypes={glassTypes}
                            isDetailed={true}
                            onRemove={onRemove}
                            onUpdate={onUpdate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShoppingCart;