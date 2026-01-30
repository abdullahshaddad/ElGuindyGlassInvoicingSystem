import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    FiArrowRight,
    FiPrinter,
    FiSend,
    FiDollarSign,
    FiUser,
    FiPackage,
    FiCalendar,
    FiHash,
    FiPhone,
    FiMapPin,
    FiFileText,
    FiTrash2,
    FiEdit,
    FiLayers,
    FiScissors
} from 'react-icons/fi';
import { Button, Badge, PageHeader } from '@components';
import LoadingSpinner from '@components/ui/LoadingSpinner';
import { ConfirmationDialog } from '@components/ui/ConfirmationDialog';
import PrintOptionsModal from '@components/ui/PrintOptionsModal';
import PaymentModal from '@components/ui/PaymentModal';
import { invoiceService } from '@services/invoiceService';
import { printJobService } from '@services/printJobService';
import { useSnackbar } from '@contexts/SnackbarContext';
import { usePermissions } from '@/contexts/AuthContext';
import { SHATAF_TYPES } from '@/constants/shatafTypes';

const InvoiceDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { showSuccess, showError, showInfo } = useSnackbar();
    const { canDeleteInvoices } = usePermissions();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPrintOptionsOpen, setIsPrintOptionsOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'warning'
    });

    useEffect(() => {
        loadInvoice();
    }, [id]);

    const loadInvoice = async () => {
        try {
            setLoading(true);
            const data = await invoiceService.getInvoice(id);
            setInvoice(data);
        } catch (err) {
            console.error('Load invoice error:', err);
            showError(t('invoices.details.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async (type) => {
        try {
            if (type === 'STICKER') {
                await printJobService.openStickerPdf(id);
            } else {
                await printJobService.openInvoicePdf(id);
            }
            showSuccess(t('invoices.details.printSuccess', { type: printJobService.getTypeText(type) }));
        } catch (err) {
            console.error('Print error:', err);
            showError(t('invoices.details.printError'));
        }
    };

    const handleSendToFactory = () => {
        setConfirmDialog({
            isOpen: true,
            title: t('invoices.details.sendToFactoryConfirmTitle'),
            message: t('invoices.details.sendToFactoryConfirmMessage', { id }),
            type: 'info',
            onConfirm: async () => {
                try {
                    await printJobService.openStickerPdf(id);
                    showSuccess(t('invoices.details.stickerOpened'));
                } catch (err) {
                    showError(t('invoices.details.stickerOpenError'));
                }
            }
        });
    };

    const handleDelete = () => {
        setConfirmDialog({
            isOpen: true,
            title: t('invoices.details.deleteConfirmTitle'),
            message: t('invoices.details.deleteConfirmMessage', { id }),
            type: 'danger',
            confirmText: t('actions.delete'),
            onConfirm: async () => {
                try {
                    await invoiceService.deleteInvoice(id);
                    showSuccess(t('invoices.details.deleteSuccess'));
                    navigate('/invoices');
                } catch (err) {
                    showError(t('invoices.details.deleteError'));
                }
            }
        });
    };

    const formatCurrency = (amount) => `${parseFloat(amount || 0).toFixed(2)} ج.م`;

    const getStatusBadge = (status) => {
        const styles = {
            PAID: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
            CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
            PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
        };
        const labels = {
            PAID: t('invoices.paid'),
            CANCELLED: t('invoices.cancelled'),
            PENDING: t('invoices.pending')
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.PENDING}`}>
                {labels[status] || t('invoices.pending')}
            </span>
        );
    };

    const getWorkStatusBadge = (workStatus) => {
        const status = workStatus || 'PENDING';
        const styles = {
            COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
            IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
            PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.PENDING}`}>
                {t(`factory.workStatus.${status}`)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <FiFileText className="text-gray-400 mb-4" size={64} />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('invoices.details.notFound')}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{t('invoices.details.notFoundMessage')}</p>
                <Button onClick={() => navigate('/invoices')}>
                    <FiArrowRight className="ml-2" />
                    {t('invoices.details.backToInvoices')}
                </Button>
            </div>
        );
    }

    const breadcrumbs = [
        { label: t('navigation.home'), href: '/' },
        { label: t('invoices.title'), href: '/invoices' },
        { label: `#${invoice.id}` }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title={`${t('invoices.invoice')} #${invoice.id}`}
                subtitle={new Date(invoice.issueDate).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}
                breadcrumbs={breadcrumbs}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsPrintOptionsOpen(true)}
                            className="flex items-center gap-2"
                        >
                            <FiPrinter size={18} />
                            {t('invoices.details.print')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleSendToFactory}
                            className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                        >
                            <FiSend size={18} />
                            {t('invoices.details.sendToFactory')}
                        </Button>
                        {invoice.status !== 'PAID' && invoice.remainingBalance > 0 && (
                            <Button
                                variant="primary"
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <FiDollarSign size={18} />
                                {t('invoices.details.recordPayment')}
                            </Button>
                        )}
                        {canDeleteInvoices() && (
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                            >
                                <FiTrash2 size={18} />
                                {t('invoices.details.delete')}
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Status Badges */}
            <div className="flex items-center gap-3">
                {getStatusBadge(invoice.status)}
                {getWorkStatusBadge(invoice.workStatus)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Info Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FiUser className="text-blue-600" />
                            {t('invoices.details.customerData')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">{t('invoices.details.name')}</label>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {['REGULAR', 'COMPANY'].includes(invoice.customer?.customerType) ? (
                                        <Link
                                            to={`/customers/${invoice.customer.id}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {invoice.customer?.name || t('common.unspecified')}
                                        </Link>
                                    ) : (
                                        invoice.customer?.name || t('common.unspecified')
                                    )}
                                </p>
                            </div>
                            {invoice.customer?.phone && (
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">{t('invoices.details.phone')}</label>
                                    <p className="font-medium text-gray-900 dark:text-white font-mono" dir="ltr">
                                        {invoice.customer.phone}
                                    </p>
                                </div>
                            )}
                            {invoice.customer?.address && (
                                <div className="md:col-span-2">
                                    <label className="text-sm text-gray-500 dark:text-gray-400">{t('invoices.details.address')}</label>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {invoice.customer.address}
                                    </p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm text-gray-500 dark:text-gray-400">{t('invoices.details.customerType')}</label>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {t(`customers.types.${invoice.customer?.customerType || 'CASH'}`)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Lines */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FiPackage className="text-green-600" />
                                {t('invoices.details.invoiceItems')} ({invoice.invoiceLines?.length || 0} {t('invoices.details.invoiceItem')})
                            </h2>
                        </div>

                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {invoice.invoiceLines && invoice.invoiceLines.length > 0 ? (
                                invoice.invoiceLines.map((line, index) => (
                                    <div key={line.id || index} className="p-6">
                                        {/* Line Header */}
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {line.glassType?.name || 'زجاج'}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <FiLayers size={14} />
                                                        {line.glassType?.thickness || '-'} مم
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {line.width?.toFixed(1)} × {line.height?.toFixed(1)} {line.dimensionUnit === 'MM' ? 'مم' : line.dimensionUnit === 'M' ? 'م' : 'سم'}
                                                    </span>
                                                    {line.quantity && line.quantity > 1 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-medium">
                                                                {line.quantity} قطعة
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{t('invoices.details.lineTotal')}</div>
                                                <div className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(line.lineTotal)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Line Details Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                            <div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('invoices.details.area')}</div>
                                                <div className="font-mono font-medium text-gray-900 dark:text-white">
                                                    {line.areaM2?.toFixed(3)} {t('common.squareMeter')}
                                                </div>
                                            </div>
                                            {line.quantity && (
                                                <div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('invoices.details.quantity')}</div>
                                                    <div className="font-mono font-medium text-gray-900 dark:text-white">
                                                        {line.quantity} {t('invoices.details.piece')}
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('invoices.details.glassPrice')}</div>
                                                <div className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency((line.lineTotal || 0) - (line.cuttingPrice || 0))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('invoices.details.operationsPrice')}</div>
                                                <div className="font-mono font-medium text-orange-600 dark:text-orange-400">
                                                    {formatCurrency(line.cuttingPrice)}
                                                </div>
                                            </div>
                                            {line.shatafMeters > 0 && (
                                                <div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('invoices.details.chamferMeters')}</div>
                                                    <div className="font-mono font-medium text-purple-600 dark:text-purple-400">
                                                        {line.shatafMeters?.toFixed(2)} {t('common.meter')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Operations - Only SHATF (Chamfer) and LASER */}
                                        {line.operations && line.operations.length > 0 && (
                                            <div className="mt-4">
                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                    <FiScissors size={14} />
                                                    {t('invoices.details.operations')} ({line.operations.length})
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {line.operations.map((op, idx) => {
                                                        const opType = op.operationType || op.type;
                                                        // Get display name for the operation
                                                        let displayName = '';
                                                        if (opType === 'SHATAF' || opType === 'SHATF') {
                                                            // SHATF/Chamfer - show the shatafType (chamfer type)
                                                            displayName = op.shatafType
                                                                ? (SHATAF_TYPES[op.shatafType]?.arabicName || op.shatafType)
                                                                : 'شطف';
                                                            // Append formula type if exists (farmaType is the calculation formula)
                                                            if (op.farmaType) {
                                                                displayName += ` - ${op.farmaType}`;
                                                            }
                                                        } else if (opType === 'LASER') {
                                                            displayName = op.laserType || 'ليزر';
                                                        } else {
                                                            displayName = op.description || opType || 'عملية';
                                                        }

                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                                                            >
                                                                <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                                                                    {displayName}
                                                                </span>
                                                                <span className="text-sm text-purple-600 dark:text-purple-400">
                                                                    {formatCurrency(op.operationPrice || op.manualPrice || 0)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    {t('invoices.details.noItems')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Summary */}
                <div className="space-y-6">
                    {/* Invoice Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {t('invoices.details.invoiceSummary')}
                        </h2>

                        <div className="space-y-4">
                            {/* Invoice Details */}
                            <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{t('invoices.invoiceNumber')}</span>
                                    <span className="font-mono font-bold text-gray-900 dark:text-white">#{invoice.id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{t('invoices.date')}</span>
                                    <span className="text-gray-900 dark:text-white">
                                        {new Date(invoice.issueDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{t('invoices.itemsCount')}</span>
                                    <span className="text-gray-900 dark:text-white">{invoice.invoiceLines?.length || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-gray-600 dark:text-gray-400">{t('invoices.workStatus')}</span>
                                    {getWorkStatusBadge(invoice.workStatus)}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('invoices.details.subtotal')}</span>
                                    <span className="font-mono text-gray-900 dark:text-white">
                                        {formatCurrency(invoice.totalPrice)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('invoices.details.tax')}</span>
                                    <span className="font-mono text-gray-900 dark:text-white">{formatCurrency(0)}</span>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{t('invoices.details.total')}</span>
                                    <span className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                                        {formatCurrency(invoice.totalPrice)}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('invoices.details.amountPaid')}</span>
                                    <span className="font-mono font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(invoice.amountPaidNow || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('invoices.details.remainingBalance')}</span>
                                    <span className={`font-mono font-bold ${
                                        (invoice.remainingBalance || 0) > 0
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                        {formatCurrency(invoice.remainingBalance || 0)}
                                    </span>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            {invoice.status !== 'PAID' && invoice.remainingBalance > 0 && (
                                <div className="pt-4">
                                    <Button
                                        onClick={() => setIsPaymentModalOpen(true)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <FiDollarSign className="me-2" />
                                        {t('invoices.details.recordPayment')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PrintOptionsModal
                isOpen={isPrintOptionsOpen}
                onClose={() => setIsPrintOptionsOpen(false)}
                onPrint={handlePrint}
            />

            {isPaymentModalOpen && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    customer={invoice.customer}
                    invoice={invoice}
                    onPaymentRecorded={() => {
                        setIsPaymentModalOpen(false);
                        loadInvoice(); // Reload invoice to get updated payment info
                    }}
                />
            )}

            <ConfirmationDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
            />
        </div>
    );
};

export default InvoiceDetailsPage;
