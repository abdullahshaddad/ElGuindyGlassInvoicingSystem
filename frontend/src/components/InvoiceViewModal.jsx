import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUser, FiPackage, FiPrinter, FiDollarSign, FiSend } from 'react-icons/fi';
import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
import LoadingSpinner from '@components/ui/LoadingSpinner';
import PaymentModal from '@components/ui/PaymentModal';
import { useInvoice } from '@services/invoiceService';
import PrintOptionsModal from '@components/ui/PrintOptionsModal';

const InvoiceViewModal = ({
    isOpen,
    onClose,
    invoice: initialInvoice,
    glassTypes,
    onPrint,
    onSendToFactory,
    onMarkAsPaid
}) => {
    const { t } = useTranslation();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isPrintOptionsOpen, setIsPrintOptionsOpen] = useState(false);

    // Fetch full invoice details from Convex (reactive - auto-updates)
    const invoiceId = initialInvoice?._id || initialInvoice?.id;
    const fullInvoice = useInvoice(isOpen ? invoiceId : null);

    // Use full invoice if available, fall back to initial
    const invoice = fullInvoice || initialInvoice;
    const loading = isOpen && invoiceId && fullInvoice === undefined;

    if (!isOpen) return null;
    if (!invoice && !loading) return null;

    const formatCurrency = (amount) => `${parseFloat(amount || 0).toFixed(2)} ${t('common.currency')}`;

    const getGlassPrice = (line) => {
        return (line.lineTotal || 0) - (line.cuttingPrice || 0);
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={loading ? t('app.loading') : t('invoiceView.title', { id: invoice?.readableId || invoice?.invoiceNumber || invoice?._id })}
                size="lg"
                footer={invoice && (
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="outline" onClick={onClose}>
                            {t('actions.close')}
                        </Button>
                        <Button
                            variant="primary"
                            icon={FiPrinter}
                            onClick={() => setIsPrintOptionsOpen(true)}
                        >
                            {t('actions.print')}
                        </Button>
                        <Button
                            onClick={() => {
                                onSendToFactory(invoice);
                                onClose();
                            }}
                            className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-white"
                        >
                            <FiSend className="ml-2" />
                            {t('invoices.sendToFactory')}
                        </Button>

                        {invoice.status !== 'PAID' && invoice.remainingBalance > 0 &&
                            ['REGULAR', 'COMPANY'].includes(invoice.customer?.customerType) && (
                                <Button
                                    variant="success"
                                    icon={FiDollarSign}
                                    onClick={() => setIsPaymentModalOpen(true)}
                                >
                                    {t('invoiceView.recordPayment')}
                                </Button>
                            )}
                    </div>
                )}
            >
                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <div className="space-y-6" dir="rtl">
                        {/* Invoice Header */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('invoiceView.invoiceNumber')}</span>
                                    <div className="font-bold text-lg text-primary-600 dark:text-primary-400">
                                        {invoice?.readableId || invoice?.invoiceNumber || invoice?._id}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('invoiceView.date')}</span>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {new Date(invoice.issueDate).toLocaleDateString('ar-EG')}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('invoiceView.statusLabel')}</span>
                                    <div>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'PAID'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                            : invoice.status === 'CANCELLED'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                            }`}>
                                            {invoice.status === 'PAID' ? t('invoiceView.statusPaid') :
                                                invoice.status === 'CANCELLED' ? t('invoiceView.statusCancelled') : t('invoiceView.statusPending')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <FiUser className="text-blue-600 dark:text-blue-400" />
                                {t('invoiceView.customerInfo')}
                            </h3>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-blue-600 dark:text-blue-400">{t('invoiceView.nameLabel')}</span>
                                        <div className="font-medium text-blue-900 dark:text-blue-200">
                                            {invoice.customer?.name || t('invoiceView.unspecified')}
                                        </div>
                                    </div>
                                    {invoice.customer?.phone && (
                                        <div>
                                            <span className="text-sm text-blue-600 dark:text-blue-400">{t('invoiceView.phoneLabel')}</span>
                                            <div className="font-medium text-blue-900 dark:text-blue-200 font-mono">
                                                {invoice.customer.phone}
                                            </div>
                                        </div>
                                    )}
                                    {invoice.customer?.address && (
                                        <div className="md:col-span-2">
                                            <span className="text-sm text-blue-600 dark:text-blue-400">{t('invoiceView.addressLabel')}</span>
                                            <div className="font-medium text-blue-900 dark:text-blue-200">
                                                {invoice.customer.address}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Invoice Lines */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <FiPackage className="text-green-600 dark:text-green-400" />
                                {t('invoiceView.productDetails', { count: invoice.invoiceLines?.length || invoice.lines?.length || 0 })}
                            </h3>
                            <div className="space-y-3">
                                {(invoice.invoiceLines || invoice.lines || []).length > 0 ? (
                                    (invoice.invoiceLines || invoice.lines).map((line, index) => (
                                        <div key={line._id || line.id || index} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-600 flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                        {line.glassType?.name || t('invoiceView.unspecifiedType')}
                                                    </h4>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-2">
                                                        <span>{line.width?.toFixed(1)} × {line.height?.toFixed(1)} {line.dimensionUnit === 'MM' ? t('common.millimeter') : line.dimensionUnit === 'M' ? t('common.meter') : t('common.centimeter')}</span>
                                                        {line.glassType?.thickness && (
                                                            <span>• {line.glassType.thickness} {t('common.millimeter')}</span>
                                                        )}
                                                        {line.quantity && line.quantity > 1 && (
                                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium">
                                                                × {line.quantity} {t('invoiceView.piece')}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {line.operations && line.operations.length > 0 ? (
                                                            line.operations.map((op, i) => {
                                                                const displayName = op.operationType?.ar || op.operationType?.code || '—';
                                                                return (
                                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                                        {displayName}
                                                                        {op.price > 0 && ` (${formatCurrency(op.price)})`}
                                                                    </span>
                                                                );
                                                            })
                                                        ) : null}
                                                    </div>
                                                    {line.notes && (
                                                        <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                                                            {line.notes}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('invoiceView.lineTotal')}</div>
                                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {formatCurrency(line.lineTotal)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 space-y-2 text-sm bg-gray-50/50 dark:bg-gray-800/50">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                                            <span>{t('invoiceView.areaLabel')}</span>
                                                            <span className="font-mono">{line.areaM2?.toFixed(3)} {t('common.meter')}²</span>
                                                        </div>
                                                        {line.quantity && line.quantity > 1 && (
                                                            <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                                                <span>{t('invoiceView.quantityLabel')}</span>
                                                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{line.quantity} {t('invoiceView.piece')}</span>
                                                            </div>
                                                        )}
                                                        {line.shatafMeters > 0 && (
                                                            <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                                                <span>{t('invoiceView.chamferMetersLabel')}</span>
                                                                <span className="font-mono">{line.shatafMeters?.toFixed(2)} {t('common.meter')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                                            <span>{t('invoiceView.glassPriceLabel')}</span>
                                                            <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                                                {formatCurrency(getGlassPrice(line))}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                                            <span>{t('invoiceView.operationsTotal')}</span>
                                                            <span className="font-mono text-orange-600 dark:text-orange-400">
                                                                {formatCurrency(line.operations?.reduce((sum, op) => sum + (op.price || 0), 0) || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {line.operations && line.operations.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                        <div className="text-xs font-semibold text-gray-500 mb-1">{t('invoiceView.operationDetails')}</div>
                                                        <ul className="space-y-1">
                                                            {line.operations.map((op, idx) => (
                                                                <li key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                                                                    <span>
                                                                        {op.operationType?.ar || op.operationType?.code || '—'}
                                                                        {op.calculationMethod && ` - ${op.calculationMethod.ar}`}
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        {formatCurrency(op.price)}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        {t('invoiceView.noItems')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Invoice Summary */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                    <span>{t('invoiceView.subtotal')}</span>
                                    <span className="font-mono font-medium">{formatCurrency(invoice.totalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                    <span>{t('invoiceView.tax')}</span>
                                    <span className="font-mono">0.00 {t('common.currency')}</span>
                                </div>
                                <div className="border-t border-green-300 dark:border-green-700 pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-green-800 dark:text-green-300">{t('invoiceView.grandTotal')}</span>
                                        <span className="text-3xl font-bold text-green-700 dark:text-green-400 font-mono">
                                            {formatCurrency(invoice.totalPrice)}
                                        </span>
                                    </div>
                                </div>
                                <div className="border-t border-green-300 dark:border-green-700 pt-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                            <span className="text-gray-600 dark:text-gray-400">{t('invoiceView.amountPaid')}</span>
                                            <span className="text-lg font-bold text-green-600 dark:text-green-400 font-mono">
                                                {formatCurrency(invoice.amountPaidNow || 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                            <span className="text-gray-600 dark:text-gray-400">{t('invoiceView.remaining')}</span>
                                            <span className={`text-lg font-bold font-mono ${(invoice.remainingBalance || 0) > 0
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                }`}>
                                                {formatCurrency(invoice.remainingBalance || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {isPaymentModalOpen && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    customer={invoice.customer}
                    invoice={invoice}
                    onPaymentRecorded={() => {
                        setIsPaymentModalOpen(false);
                    }}
                />
            )}

            <PrintOptionsModal
                isOpen={isPrintOptionsOpen}
                onClose={() => setIsPrintOptionsOpen(false)}
                onPrint={(type) => onPrint(invoice, type)}
            />
        </>
    );
};

export default InvoiceViewModal;
