import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import { FiDollarSign, FiCreditCard, FiCheck } from 'react-icons/fi';
import { useRecordPayment, getPaymentMethodOptions } from '@/services/paymentService';

/**
 * Payment Modal Component
 * Modal for recording customer payments with validation
 */
const PaymentModal = ({
    isOpen,
    onClose,
    customer,
    invoice = null,
    onPaymentRecorded
}) => {
    const [formData, setFormData] = useState({
        amount: invoice ? invoice.remainingBalance : '',
        paymentMethod: 'CASH',
        referenceNumber: '',
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { t } = useTranslation();

    const recordPayment = useRecordPayment();
    const paymentMethods = getPaymentMethodOptions();

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const validateForm = () => {
        if (!formData.amount || formData.amount <= 0) {
            setError(t('paymentModal.amountRequired'));
            return false;
        }

        if (invoice && formData.amount > invoice.remainingBalance) {
            setError(t('paymentModal.exceedsBalance', { amount: formatCurrency(invoice.remainingBalance) }));
            return false;
        }

        if (customer?.balance && formData.amount > customer.balance) {
            setError(t('paymentModal.exceedsCustomerBalance', { amount: formatCurrency(customer.balance) }));
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const customerId = customer._id || customer.id;
            const invoiceId = invoice?._id || invoice?.id || undefined;

            await recordPayment({
                customerId,
                invoiceId,
                amount: parseFloat(formData.amount),
                paymentMethod: formData.paymentMethod,
                referenceNumber: formData.referenceNumber || undefined,
                notes: formData.notes || undefined
            });

            if (onPaymentRecorded) {
                onPaymentRecorded();
            }

            setFormData({
                amount: '',
                paymentMethod: 'CASH',
                referenceNumber: '',
                notes: ''
            });
            onClose();
        } catch (err) {
            console.error('Payment recording error:', err);
            setError(err.message || t('paymentModal.error'));
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return `${parseFloat(amount || 0).toFixed(2)} ${t('common.currency')}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('paymentModal.title')}
            maxWidth="md"
            footer={(
                <div className="flex gap-3 justify-end w-full">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {t('actions.cancel')}
                    </Button>
                    <Button
                        form="payment-form"
                        type="submit"
                        variant="primary"
                        loading={loading}
                        icon={FiDollarSign}
                    >
                        {t('paymentModal.recordPayment')}
                    </Button>
                </div>
            )}
        >
            <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Customer Info */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {t('paymentModal.customer')}
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                        {customer?.name}
                    </div>
                    {customer?.phone && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {customer.phone}
                        </div>
                    )}
                    {customer?.balance > 0 && (
                        <div className="mt-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{t('paymentModal.outstandingBalance')} </span>
                            <span className="font-semibold text-red-600 dark:text-red-400">
                                {formatCurrency(customer.balance)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Invoice Info (if applicable) */}
                {invoice && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                            {t('paymentModal.invoiceLabel', { id: invoice.readableId || invoice.invoiceNumber || invoice._id })}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">{t('paymentModal.totalAmount')} </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {formatCurrency(invoice.totalPrice)}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">{t('paymentModal.paid')} </span>
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                    {formatCurrency(invoice.amountPaidNow || 0)}
                                </span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-gray-600 dark:text-gray-400">{t('paymentModal.remaining')} </span>
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                    {formatCurrency(invoice.remainingBalance)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('paymentModal.paymentAmount')}
                        <span className="text-red-500 mr-1">*</span>
                    </label>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => handleChange('amount', e.target.value)}
                        placeholder={t('paymentModal.enterAmount')}
                        icon={FiDollarSign}
                        disabled={loading}
                        required
                    />
                    {invoice && (
                        <button
                            type="button"
                            onClick={() => handleChange('amount', invoice.remainingBalance)}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-1"
                            disabled={loading}
                        >
                            {t('paymentModal.payFullRemaining')}
                        </button>
                    )}
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('paymentModal.paymentMethod')}
                        <span className="text-red-500 mr-1">*</span>
                    </label>
                    <Select
                        value={formData.paymentMethod}
                        onChange={(e) => handleChange('paymentMethod', e.target.value)}
                        disabled={loading}
                        required
                    >
                        {paymentMethods.map(method => (
                            <option key={method.value} value={method.value}>
                                {method.label}
                            </option>
                        ))}
                    </Select>
                </div>

                {/* Reference Number (optional for non-cash payments) */}
                {formData.paymentMethod !== 'CASH' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('paymentModal.referenceNumber')}
                        </label>
                        <Input
                            type="text"
                            value={formData.referenceNumber}
                            onChange={(e) => handleChange('referenceNumber', e.target.value)}
                            placeholder={t('paymentModal.referencePlaceholder')}
                            icon={FiCheck}
                            disabled={loading}
                        />
                    </div>
                )}

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('paymentModal.notes')}
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        placeholder={t('paymentModal.notesPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-primary-500 focus:border-transparent
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        rows="3"
                        disabled={loading}
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {error}
                        </p>
                    </div>
                )}
            </form>
        </Modal>
    );
};

export default PaymentModal;
