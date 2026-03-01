import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiUser, FiSearch, FiX, FiPlus, FiDollarSign } from 'react-icons/fi';
import Input from '@components/ui/Input.jsx';
import SearchInput from '@components/ui/SearchInput.jsx';
import Button from '@components/ui/Button.jsx';
import LoadingSpinner from '@components/ui/LoadingSpinner.jsx';
import Badge from '@components/ui/Badge.jsx';

/**
 * CustomerSelection Component
 * Enhanced with customer type display and balance information
 */
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
    const { t } = useTranslation();

    // Get customer type badge variant
    const getCustomerTypeBadge = (customerType) => {
        switch (customerType) {
            case 'CASH':
                return { variant: 'success', label: t('customers.types.CASH') };
            case 'COMPANY':
                return { variant: 'info', label: t('customers.types.COMPANY') };
            case 'REGULAR':
            default:
                return { variant: 'default', label: t('customers.customer') };
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <FiUser className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                {t('invoices.selectCustomer')}
                {selectedCustomer && (
                    <span className="mr-auto text-sm font-normal">
                        <Badge
                            variant={getCustomerTypeBadge(selectedCustomer.customerType).variant}
                            className="text-xs"
                        >
                            {getCustomerTypeBadge(selectedCustomer.customerType).label}
                        </Badge>
                    </span>
                )}
            </h3>

            {selectedCustomer ? (
                // Selected Customer Display
                <div className="space-y-3">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {selectedCustomer.name}
                                    </h4>
                                    <Badge
                                        variant={getCustomerTypeBadge(selectedCustomer.customerType).variant}
                                        className="text-xs"
                                    >
                                        {getCustomerTypeBadge(selectedCustomer.customerType).label}
                                    </Badge>
                                </div>

                                {selectedCustomer.phone && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mb-1" dir="ltr">
                                        {selectedCustomer.phone}
                                    </p>
                                )}

                                {selectedCustomer.address && (
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                        {selectedCustomer.address}
                                    </p>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearSelection}
                                className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            >
                                <FiX size={20} />
                            </Button>
                        </div>

                        {/* Customer Balance (for REGULAR and COMPANY only) */}
                        {selectedCustomer.customerType !== 'CASH' && (
                            <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <FiDollarSign size={16} />
                                        <span>{t('payment.customerCurrentBalance')}</span>
                                    </div>
                                    <span className={`text-base font-bold font-mono ${(selectedCustomer.balance || 0) > 0
                                            ? 'text-orange-600 dark:text-orange-400'
                                            : 'text-green-600 dark:text-green-400'
                                        }`}>
                                        {(selectedCustomer.balance || 0).toFixed(2)} {t('payment.currency')}
                                    </span>
                                </div>
                                {(selectedCustomer.balance || 0) > 0 && (
                                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                        {t('customers.hasOutstandingBalance')}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Cash Customer Info */}
                        {selectedCustomer.customerType === 'CASH' && (
                            <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded px-3 py-2">
                                    <span>✓</span>
                                    <span>{t('customers.cashCustomerInfo')}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Customer Search
                <div className="space-y-3">
                    <div className="relative">
                        <SearchInput
                            placeholder={t('customers.searchPlaceholder')}
                            value={customerSearch}
                            onChange={(e) => onCustomerSearchChange(e.target.value)}
                        />
                        {isSearchingCustomers && (
                            <div className="absolute start-3 top-1/2 -translate-y-1/2">
                                <LoadingSpinner size="sm" />
                            </div>
                        )}
                    </div>

                    {/* Search Results */}
                    {customerResults.length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                            {customerResults.map((customer) => {
                                const typeBadge = getCustomerTypeBadge(customer.customerType);

                                return (
                                    <div
                                        key={customer._id || customer.id}
                                        onClick={() => onSelectCustomer(customer)}
                                        className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {customer.name}
                                                    </p>
                                                    <Badge variant={typeBadge.variant} className="text-xs">
                                                        {typeBadge.label}
                                                    </Badge>
                                                </div>

                                                {customer.phone && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono" dir="ltr">
                                                        {customer.phone}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Balance indicator for REGULAR/COMPANY */}
                                            {customer.customerType !== 'CASH' && customer.balance > 0 && (
                                                <div className="text-left mr-2">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('customers.fields.balance')}:</p>
                                                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400 font-mono">
                                                        {customer.balance.toFixed(2)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* No Results */}
                    {customerSearch.length >= 2 && !isSearchingCustomers && customerResults.length === 0 && (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                            <div className="p-3 bg-gray-200 dark:bg-gray-800 rounded-full w-fit mx-auto mb-3">
                                <FiUser size={32} className="text-gray-400 dark:text-gray-600" />
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                                {t('customers.noResults')}
                            </p>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onStartNewCustomer(customerSearch)}
                                className="mx-auto"
                            >
                                <FiPlus className="ml-2" />
                                {t('customers.addNewCustomer')}: {customerSearch}
                            </Button>
                        </div>
                    )}

                    {/* Instructions */}
                    {customerSearch.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-3">
                                <FiSearch size={32} className="text-gray-400 dark:text-gray-600" />
                            </div>
                            <p className="text-sm">{t('customers.searchOrAddNew')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomerSelection;