import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import Modal from '@components/ui/Modal.jsx';
import Button from '@components/ui/Button.jsx';
import Badge from '@components/ui/Badge.jsx';

/**
 * InvoiceConfirmationDialog Component
 * Shows confirmation with customer type-specific messaging
 */
const InvoiceConfirmationDialog = ({
                                       isOpen,
                                       onClose,
                                       onConfirm,
                                       customer,
                                       totalAmount,
                                       amountPaidNow,
                                       remainingBalance,
                                       isCreating = false
                                   }) => {
    if (!customer) return null;

    const isCashCustomer = customer.customerType === 'CASH';
    const isPaidInFull = remainingBalance === 0;
    const newCustomerBalance = (customer.balance || 0) + remainingBalance;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="تأكيد إنشاء الفاتورة"
            size="md"
        >
            <div className="space-y-6" dir="rtl">

                {/* Customer Info */}
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            معلومات العميل
                        </h4>
                        <Badge
                            variant={isCashCustomer ? 'success' : 'info'}
                            className="text-xs"
                        >
                            {isCashCustomer ? 'عميل نقدي' : customer.customerType === 'COMPANY' ? 'شركة' : 'عميل عادي'}
                        </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">الاسم:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{customer.name}</span>
                        </div>
                        {customer.phone && (
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">الهاتف:</span>
                                <span className="font-mono text-gray-900 dark:text-white" dir="ltr">{customer.phone}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        ملخص الفاتورة
                    </h4>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">إجمالي الفاتورة:</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {totalAmount.toFixed(2)} جنيه
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">المبلغ المدفوع الآن:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                                {amountPaidNow.toFixed(2)} جنيه
                            </span>
                        </div>

                        {!isCashCustomer && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">المبلغ المتبقي:</span>
                                    <span className={`font-semibold ${remainingBalance > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                                        {remainingBalance.toFixed(2)} جنيه
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">الرصيد الحالي:</span>
                                        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                                            {customer.balance?.toFixed(2) || '0.00'} جنيه
                                        </span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-gray-900 dark:text-white font-semibold">الرصيد الجديد:</span>
                                        <span className="font-bold text-blue-700 dark:text-blue-300">
                                            {newCustomerBalance.toFixed(2)} جنيه
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Confirmation Message */}
                <div className={`${
                    isCashCustomer
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : isPaidInFull
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                } border rounded-lg p-4`}>
                    <div className="flex items-start gap-3">
                        {isCashCustomer || isPaidInFull ? (
                            <FiCheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                        ) : (
                            <FiInfo className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                        )}
                        <div className="flex-1">
                            {isCashCustomer ? (
                                <>
                                    <h5 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                        فاتورة مدفوعة بالكامل
                                    </h5>
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        سيتم تسجيل الفاتورة كمدفوعة بالكامل. العميل النقدي لا يمكن أن يكون له رصيد مستحق.
                                    </p>
                                </>
                            ) : isPaidInFull ? (
                                <>
                                    <h5 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                        فاتورة مدفوعة بالكامل
                                    </h5>
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        سيتم تسجيل الفاتورة كمدفوعة بالكامل. لن يتم إضافة أي رصيد على العميل.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                        رصيد متبقي على العميل
                                    </h5>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        سيتم إضافة المبلغ المتبقي ({remainingBalance.toFixed(2)} جنيه) إلى رصيد العميل.
                                        الرصيد الجديد سيكون {newCustomerBalance.toFixed(2)} جنيه.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Warning for partial payment */}
                {!isCashCustomer && remainingBalance > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <FiAlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-amber-800 dark:text-amber-200">
                                تأكد من أن العميل على علم بالمبلغ المتبقي وموافق على تسجيله في رصيده.
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <Button
                        variant="primary"
                        onClick={onConfirm}
                        disabled={isCreating}
                        loading={isCreating}
                        className="flex-1"
                    >
                        {isCreating ? 'جاري إنشاء الفاتورة...' : 'تأكيد وإنشاء الفاتورة'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isCreating}
                        className="flex-1"
                    >
                        إلغاء
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default InvoiceConfirmationDialog;