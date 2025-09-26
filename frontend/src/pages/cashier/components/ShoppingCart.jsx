import React from 'react';
import { FiShoppingCart } from 'react-icons/fi';
import PricingBreakdown from './PricingBreakdown';

const ShoppingCart = ({ cart, glassTypes, onRemove, onUpdate }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                    <FiShoppingCart className="text-purple-600" size={20}/>
                </div>
                سلة المشتريات
                {cart.length > 0 && (
                    <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full border border-purple-200">
                        {cart.length}
                    </span>
                )}
            </h3>

            {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <div className="p-4 bg-purple-50 rounded-full w-fit mx-auto mb-3">
                        <FiShoppingCart size={48} className="text-purple-300"/>
                    </div>
                    <p className="font-medium">لا توجد منتجات في السلة</p>
                    <p className="text-sm">ابدأ بإضافة منتجات للفاتورة</p>
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