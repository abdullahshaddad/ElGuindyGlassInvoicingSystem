import React, { useRef } from 'react';
import { FiUser, FiEdit3, FiSearch, FiPlus } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CustomerSelection = ({
                               selectedCustomer,
                               customerSearch,
                               customerResults,
                               isSearchingCustomers,
                               onCustomerSearchChange,
                               onSelectCustomer,
                               onStartNewCustomer,
                               onClearSelection
                           }) => {
    const customerSearchRef = useRef(null);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <FiUser className="text-blue-600" size={20}/>
                </div>
                اختيار العميل
            </h3>

            {selectedCustomer ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                    <div>
                        <div className="font-semibold text-emerald-900">{selectedCustomer.name}</div>
                        {selectedCustomer.phone && (
                            <div className="text-sm text-emerald-700 font-mono">{selectedCustomer.phone}</div>
                        )}
                        {selectedCustomer.address && (
                            <div className="text-sm text-emerald-600">{selectedCustomer.address}</div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearSelection}
                        className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100"
                    >
                        <FiEdit3/>
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="relative">
                        <Input
                            ref={customerSearchRef}
                            placeholder="البحث بالاسم أو رقم الهاتف..."
                            value={customerSearch}
                            onChange={(e) => onCustomerSearchChange(e.target.value)}
                            icon={isSearchingCustomers ? <LoadingSpinner size="sm"/> : <FiSearch/>}
                            className="border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />

                        {/* Customer Search Results */}
                        {customerResults.length > 0 && (
                            <div className="absolute bg-white z-10 w-full mt-1 border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                {customerResults.map((customer) => (
                                    <button
                                        key={customer.id}
                                        onClick={() => onSelectCustomer(customer)}
                                        className="w-full p-4 text-right hover:bg-blue-50 hover:text-blue-900 border-b border-gray-200 last:border-b-0 transition-all duration-200"
                                    >
                                        <div className="font-medium text-gray-900">{customer.name}</div>
                                        {customer.phone && (
                                            <div className="text-sm text-gray-500 font-mono">{customer.phone}</div>
                                        )}
                                        {customer.address && (
                                            <div className="text-xs text-gray-500">{customer.address}</div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add New Customer Button */}
                    {customerSearch.length >= 2 && customerResults.length === 0 && !isSearchingCustomers && (
                        <Button
                            variant="outline"
                            onClick={onStartNewCustomer}
                            className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                        >
                            <FiPlus className="ml-2"/>
                            إضافة عميل جديد: "{customerSearch}"
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomerSelection;