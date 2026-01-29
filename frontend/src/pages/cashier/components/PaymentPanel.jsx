import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiDollarSign, FiAlertCircle, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import Input from '@components/ui/Input.jsx';
import Select from '@components/ui/Select.jsx';
import Badge from '@components/ui/Badge.jsx';

/**
 * PaymentPanel Component
 * Handles payment logic with customer type-specific validation
 * - CASH: Must pay full amount, no partial payment
 * - REGULAR/COMPANY: Can pay partially, balance tracked
 */
const PaymentPanel = ({
    customer,
    totalAmount,
    amountPaidNow,
    onAmountPaidNowChange,
    paymentMethod,
    onPaymentMethodChange,
    disabled = false
}) => {
    const { t } = useTranslation();
    const [validation, setValidation] = useState({ isValid: true, message: '' });
    const [customerPreviousBalance, setCustomerPreviousBalance] = useState(0);

    // Calculate remaining and new balance
    const remainingBalance = totalAmount - (amountPaidNow || 0);
    const newCustomerBalance = customerPreviousBalance + remainingBalance;

    useEffect(() => {
        // Set previous balance from customer
        if (customer?.balance !== undefined) {
            setCustomerPreviousBalance(customer.balance);
        }
    }, [customer]);

    useEffect(() => {
        // Validate payment based on customer type
        if (!customer) {
            setValidation({ isValid: true, message: '' });
            return;
        }

        const paid = amountPaidNow || 0;

        if (customer.customerType === 'CASH') {
            // Cash customers must pay full amount
            if (paid !== totalAmount) {
                setValidation({
                    isValid: false,
                    message: t('payment.cashMustPayFull')
                });
            } else {
                setValidation({ isValid: true, message: '' });
            }
        } else {
            // Regular/Company can pay any amount >= 0
            if (paid < 0) {
                setValidation({
                    isValid: false,
                    message: t('payment.invalidAmount')
                });
            } else if (paid > totalAmount) {
                setValidation({
                    isValid: false,
                    message: t('payment.amountExceedsTotal')
                });
            } else {
                setValidation({ isValid: true, message: '' });
            }
        }
    }, [customer, amountPaidNow, totalAmount]);

    // Auto-set amount for CASH customers
    useEffect(() => {
        if (customer?.customerType === 'CASH' && totalAmount > 0) {
            onAmountPaidNowChange(totalAmount);
        }
    }, [customer, totalAmount]);

    if (!customer) {
        return (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <FiAlertCircle size={20} />
                    <span className="text-sm">{t('payment.selectCustomerFirst')}</span>
                </div>
            </div>
        );
    }

    const isCashCustomer = customer.customerType === 'CASH';
    const canHaveBalance = !isCashCustomer;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FiDollarSign className="text-green-600 dark:text-green-400" />
                    {t('payment.title')}
                </h3>
                <Badge
                    variant={isCashCustomer ? 'success' : 'info'}
                    className="text-xs"
                >
                    {isCashCustomer ? t('payment.cashCustomer') : customer.customerType === 'COMPANY' ? t('payment.company') : t('customers.customer')}
                </Badge>
            </div>

            {/* Cash Customer Warning */}
            {isCashCustomer && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                        <FiAlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            {t('payment.cashCustomerWarning')}
                        </p>
                    </div>
                </div>
            )}

            {/* Payment Fields */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">

                {/* Total Amount (Read-only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('payment.invoiceTotal')}
                    </label>
                    <div className="relative rounded-lg">
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                            <FiDollarSign size={18} />
                        </div>
                        <Input
                            type="text"
                            value={`${totalAmount.toFixed(2)} ${t('payment.currency')}`}
                            disabled
                            className="pr-10 bg-gray-50 dark:bg-gray-900 font-semibold text-lg"
                        />
                    </div>
                </div>

                {/* Amount Paid Now */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('payment.amountPaidNow')}
                        <span className="text-red-500 mr-1">*</span>
                    </label>
                    <Input
                        type="number"
                        value={amountPaidNow || ''}
                        onChange={(e) => onAmountPaidNowChange(parseFloat(e.target.value) || 0)}
                        disabled={disabled || isCashCustomer}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        max={totalAmount}
                        icon={<FiDollarSign />}
                        error={!validation.isValid}
                        className={isCashCustomer ? 'bg-gray-100 dark:bg-gray-900' : ''}
                    />
                    {!validation.isValid && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                            <FiAlertCircle size={14} />
                            {validation.message}
                        </p>
                    )}
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('payment.paymentMethod')}
                        <span className="text-red-500 mr-1">*</span>
                    </label>
                    <Select
                        value={paymentMethod || 'CASH'}
                        onChange={(e) => onPaymentMethodChange(e.target.value)}
                        disabled={disabled}
                        icon={<FiCreditCard />}
                    >
                        <option value="CASH">{t('payment.methods.CASH')}</option>
                        <option value="CARD">{t('payment.methods.CARD')}</option>
                        <option value="BANK_TRANSFER">{t('payment.methods.BANK_TRANSFER')}</option>
                        <option value="CHECK">{t('payment.methods.CHECK')}</option>
                        <option value="VODAFONE_CASH">{t('payment.methods.VODAFONE_CASH')}</option>
                    </Select>
                </div>

                {/* Balance Information for Regular/Company Customers */}
                {canHaveBalance && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">

                        {/* Remaining Balance */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('payment.remainingBalance')}
                            </span>
                            <Badge
                                variant={remainingBalance > 0 ? 'warning' : 'success'}
                                className="text-sm font-semibold"
                            >
                                {remainingBalance.toFixed(2)} {t('payment.currency')}
                            </Badge>
                        </div>

                        {/* Customer Previous Balance */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {t('payment.customerCurrentBalance')}
                            </span>
                            <span className={`text-sm font-mono ${customerPreviousBalance > 0
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-green-600 dark:text-green-400'
                                }`}>
                                {customerPreviousBalance.toFixed(2)} {t('payment.currency')}
                            </span>
                        </div>

                        {/* New Customer Balance */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    {t('payment.newBalanceAfter')}
                                </span>
                                <span className="text-lg font-bold text-blue-700 dark:text-blue-300 font-mono">
                                    {newCustomerBalance.toFixed(2)} {t('payment.currency')}
                                </span>
                            </div>
                            {remainingBalance > 0 && (
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                                    {t('payment.remainingWillBeAdded')}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Paid in Full Indicator */}
                {remainingBalance === 0 && amountPaidNow > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <FiCheckCircle />
                            <span className="text-sm font-medium">
                                {t('payment.paidInFull')}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Validation Status */}
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {validation.isValid ? (
                    <span className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                        <FiCheckCircle size={14} />
                        {t('payment.paymentInfoValid')}
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
                        <FiAlertCircle size={14} />
                        {t('payment.fixPaymentInfo')}
                    </span>
                )}
            </div>
        </div>
    );
};

export default PaymentPanel;