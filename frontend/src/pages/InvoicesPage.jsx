import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus } from 'react-icons/fi';
import {
    Button,
    PageHeader,
} from '@components';
import { ConfirmationDialog } from '@components/ui/ConfirmationDialog';
import PrintOptionsModal from '@components/ui/PrintOptionsModal';
import { useInvoices, useMarkAsPaid, useDeleteInvoice } from '@services/invoiceService';
import { usePrintInvoice } from '@services/printService';
import { useSnackbar } from '@contexts/SnackbarContext';
import useAuthorized from '@hooks/useAuthorized';
import { useNavigate } from 'react-router-dom';
import InvoiceList from '@/pages/cashier/components/InvoiceList';

const InvoicesPage = () => {
    const { t, i18n } = useTranslation();
    const { isAuthorized, isLoading: authLoading } = useAuthorized(['CASHIER', 'ADMIN', 'OWNER']);
    const { showSuccess, showError, showInfo } = useSnackbar();
    const navigate = useNavigate();

    // Filters match InvoiceList expectations
    const [filters, setFilters] = useState({
        invoiceId: '',
        startDate: '',
        endDate: '',
        customerName: '',
        status: ''
    });

    const [isPrintOptionsOpen, setIsPrintOptionsOpen] = useState(false);
    const [invoiceToPrint, setInvoiceToPrint] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSendingToFactory, setIsSendingToFactory] = useState(false);

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'warning'
    });

    // Build query args from filters
    const queryArgs = useMemo(() => {
        const args = {};
        if (filters.status) args.status = filters.status;
        if (filters.startDate) args.startDate = new Date(filters.startDate).getTime();
        if (filters.endDate) args.endDate = new Date(filters.endDate).getTime();
        return args;
    }, [filters.status, filters.startDate, filters.endDate]);

    // Convex paginated query - real-time, auto-updating
    const { results: invoicesRaw, status: paginationStatus, loadMore } = useInvoices({
        ...queryArgs,
        initialNumItems: 20
    });

    // Convex mutations
    const markAsPaidMutation = useMarkAsPaid();
    const deleteInvoiceMutation = useDeleteInvoice();
    const { printInvoice: doPrintInvoice, printAllStickers } = usePrintInvoice();

    // Derive loading state
    const loading = paginationStatus === 'LoadingFirstPage';

    // Client-side filtering for invoiceId and customerName (text search)
    const invoices = useMemo(() => {
        let filtered = invoicesRaw || [];
        if (filters.invoiceId) {
            const idQuery = filters.invoiceId.toLowerCase();
            filtered = filtered.filter(inv =>
                String(inv.invoiceNumber || '').includes(idQuery) ||
                String(inv.readableId || '').toLowerCase().includes(idQuery)
            );
        }
        if (filters.customerName) {
            const nameQuery = filters.customerName.toLowerCase();
            filtered = filtered.filter(inv =>
                (inv.customer?.name || inv.customerName || '').toLowerCase().includes(nameQuery)
            );
        }
        return filtered;
    }, [invoicesRaw, filters.invoiceId, filters.customerName]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handlePageChange = () => {
        // With Convex pagination, we use loadMore instead of page-based navigation
        if (paginationStatus === 'CanLoadMore') {
            loadMore(20);
        }
    };

    const handleViewDetails = (invoice) => {
        navigate(`/invoices/${invoice._id || invoice.id}`);
    };

    const handlePrintInvoice = (invoice) => {
        if (!invoice || !(invoice._id || invoice.id)) return;
        setInvoiceToPrint(invoice);
        setIsPrintOptionsOpen(true);
    };

    const handlePrintOption = async (type) => {
        if (!invoiceToPrint) return;

        try {
            setIsPrinting(true);
            const invoiceId = invoiceToPrint._id || invoiceToPrint.id;
            if (type === 'STICKER') {
                await printAllStickers(invoiceId);
            } else {
                await doPrintInvoice(invoiceId, type);
            }
            showSuccess(t('invoices.printCreated', { type: t(`invoices.printType.${type}`), id: invoiceId }));
        } catch (err) {
            console.error('Print error:', err);
            showError(t('invoices.details.printError'));
        } finally {
            setIsPrinting(false);
            setInvoiceToPrint(null);
        }
    };

    const handleSendToFactory = async (invoice) => {
        if (!invoice || !(invoice._id || invoice.id)) {
            showError(t('invoices.invalidInvoice'));
            return;
        }

        const invoiceId = invoice._id || invoice.id;

        setConfirmDialog({
            isOpen: true,
            title: t('invoices.details.sendToFactoryConfirmTitle'),
            message: t('invoices.details.sendToFactoryConfirmMessage', { id: invoice.readableId }),
            type: 'info',
            onConfirm: async () => {
                await executeSendToFactory(invoice);
            }
        });
    };

    const executeSendToFactory = async (invoice) => {
        try {
            setIsSendingToFactory(true);
            const invoiceId = invoice._id || invoice.id;
            await printAllStickers(invoiceId);
            showSuccess(t('invoices.stickerSentSuccess', { id: invoiceId }));
        } catch (err) {
            console.error('Send to factory error:', err);
            showError(t('invoices.stickerSentError'));
        } finally {
            setIsSendingToFactory(false);
        }
    };

    const handleMarkAsPaid = async (invoice) => {
        const invoiceId = invoice._id || invoice.id;
        setConfirmDialog({
            isOpen: true,
            title: t('invoices.payInvoice'),
            message: t('invoices.payInvoiceConfirm', { id: invoiceId }),
            type: 'warning',
            confirmText: t('invoices.payBtn'),
            cancelText: t('actions.cancel'),
            onConfirm: async () => {
                await executeMarkAsPaid(invoice);
            }
        });
    };

    const executeMarkAsPaid = async (invoice) => {
        try {
            const invoiceId = invoice._id || invoice.id;
            await markAsPaidMutation({ invoiceId });
            showSuccess(t('invoices.paidSuccess', { id: invoiceId }));
            // No manual refetch needed - Convex auto-updates
        } catch (err) {
            console.error('Mark as paid error:', err);
            showError(t('invoices.paidError'));
        }
    };

    const handleAddInvoice = () => {
        navigate('/sys-cashier');
    };

    const handleDeleteInvoice = (invoice) => {
        const invoiceId = invoice._id || invoice.id;
        setConfirmDialog({
            isOpen: true,
            title: t('invoices.deleteInvoice'),
            message: t('invoices.deleteConfirmFull', { id: invoiceId }),
            type: 'danger',
            confirmText: t('actions.delete'),
            cancelText: t('actions.cancel'),
            onConfirm: async () => {
                await executeDeleteInvoice(invoice);
            }
        });
    };

    const executeDeleteInvoice = async (invoice) => {
        try {
            const invoiceId = invoice._id || invoice.id;
            await deleteInvoiceMutation({ invoiceId });
            showSuccess(t('invoices.deletedSuccess', { id: invoiceId }));
            // No manual refetch needed - Convex auto-updates
        } catch (err) {
            console.error('Delete invoice error:', err);
            showError(t('invoices.deletedError'));
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-gray-600 dark:text-gray-400">
                    {t('common.loading', 'جاري التحميل...')}
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-red-600 dark:text-red-400">
                    {t('common.unauthorized', 'غير مصرح لك بالوصول')}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 dark:bg-gray-900">
            <PageHeader
                title={t('invoices.title', 'إدارة الفواتير')}
                subtitle={t('invoices.subtitle', 'عرض وإدارة فواتير المبيعات')}
                breadcrumbs={[
                    { label: t('navigation.home', 'الرئيسية'), href: '/' },
                    { label: t('invoices.title', 'الفواتير') }
                ]}
                action={
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleAddInvoice}
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white"
                        >
                            <FiPlus size={20} />
                            <span>{t('invoices.actions.add_invoice', 'إضافة فاتورة')}</span>
                        </Button>
                    </div>
                }
            />

            {/* Invoice List Component */}
            <InvoiceList
                invoices={invoices}
                loading={loading}
                currentPage={0}
                totalPages={paginationStatus === 'CanLoadMore' ? 2 : 1}
                onPageChange={handlePageChange}
                onViewInvoice={handleViewDetails}
                onPrintInvoice={handlePrintInvoice}
                onSendToFactory={handleSendToFactory}
                onDeleteInvoice={handleDeleteInvoice}
                filters={filters}
                onFilterChange={handleFilterChange}
                showControls={true}
                isPrinting={isPrinting}
                isSendingToFactory={isSendingToFactory}
            />

            {/* Load More Button */}
            {paginationStatus === 'CanLoadMore' && (
                <div className="flex justify-center py-4">
                    <Button
                        variant="outline"
                        onClick={() => loadMore(20)}
                        className="px-8"
                    >
                        {t('common.loadMore', 'تحميل المزيد')}
                    </Button>
                </div>
            )}

            {paginationStatus === 'LoadingMore' && (
                <div className="flex justify-center py-4">
                    <div className="text-gray-500 dark:text-gray-400">
                        {t('common.loading', 'جاري التحميل...')}
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
                type={confirmDialog.type}
            />
            {/* Print Options Modal */}
            <PrintOptionsModal
                isOpen={isPrintOptionsOpen}
                onClose={() => setIsPrintOptionsOpen(false)}
                onPrint={handlePrintOption}
            />
        </div>
    );
};

export default InvoicesPage;
